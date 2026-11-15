use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use crate::auth::AuthUser;
use crate::db::eq;
use crate::duty_logic::{minutes, round4, ts};
use crate::error::{ok, ok_with, ApiResponse, AppError};
use crate::services::discord;
use crate::services::duty::{self, active_session};
use crate::services::manager::{self, QueueRow};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize, Default)]
pub struct DutyActionReq {
    pub target_discord_id: Option<String>,
}

fn resolve_target<'a>(user: &'a AuthUser, payload: Option<&'a DutyActionReq>) -> Result<&'a str, AppError> {
    match payload.and_then(|p| p.target_discord_id.as_deref()) {
        Some(target) if target != user.discord_id => {
            if !user.is_admin() {
                return Err(AppError::Forbidden);
            }
            Ok(target)
        }
        _ => Ok(&user.discord_id),
    }
}

fn changed_elsewhere() -> AppError {
    AppError::Conflict("สถานะเวรเปลี่ยนไปแล้ว กรุณารีเฟรชหน้า".into())
}

pub async fn clock_in(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    payload: Option<Json<DutyActionReq>>,
) -> ApiResult<()> {
    let target_id = resolve_target(&user, payload.as_ref().map(|p| &p.0))?;
    if active_session(&st.db, target_id).await?.is_some() {
        return Err(AppError::Conflict("คุณเข้าเวรอยู่แล้ว".into()));
    }
    st.db
        .insert(
            "duty_logs",
            &json!({ "discord_id": target_id, "status": "on_duty", "clock_in": ts(Utc::now()), "total_break_minutes": 0 }),
        )
        .await?;
    discord::notify_clock_in(Arc::clone(&st), target_id.to_string());
    Ok(ok("เข้าเวรสำเร็จ"))
}

pub async fn toggle_break(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    payload: Option<Json<DutyActionReq>>,
) -> ApiResult<Value> {
    let target_id = resolve_target(&user, payload.as_ref().map(|p| &p.0))?;
    let s = active_session(&st.db, target_id)
        .await?
        .ok_or_else(|| AppError::BadRequest("คุณยังไม่ได้เข้าเวร".into()))?;
    let now = Utc::now();

    if s.status == "on_duty" {
        let n = st
            .db
            .update(
                "duty_logs",
                &[("id", eq(&s.id)), ("status", eq("on_duty"))],
                &json!({ "status": "on_break", "last_break_start": ts(now) }),
            )
            .await?;
        if n == 0 {
            return Err(changed_elsewhere());
        }
        // Doctors on break leave the queue.
        manager::clear_queue_for(&st.db, target_id).await?;
        discord::notify_break(Arc::clone(&st), target_id.to_string(), true);
        return Ok(ok_with("เริ่มพักเบรก", json!({ "status": "on_break" })));
    }

    // Coming back from break. The 15-minute limit is enforced here, not in the browser.
    if let Some(deadline) = s.break_deadline().filter(|d| *d <= now) {
        duty::close_session(&st.db, &s, deadline, "eq.on_break").await?.ok_or_else(changed_elsewhere)?;
        let _ = manager::clear_queue_for(&st.db, target_id).await;
        discord::notify_auto_clock_out(Arc::clone(&st), target_id.to_string());
        return Ok(ok_with(
            "พักเบรกเกิน 15 นาที ระบบออกเวรให้อัตโนมัติแล้ว",
            json!({ "status": "completed" }),
        ));
    }

    let since = s.last_break_start.unwrap_or(now);
    let total_break = round4(s.total_break_minutes.unwrap_or(0.0) + minutes(since, now));
    let n = st
        .db
        .update(
            "duty_logs",
            &[("id", eq(&s.id)), ("status", eq("on_break"))],
            &json!({ "status": "on_duty", "total_break_minutes": total_break, "last_break_start": null }),
        )
        .await?;
    if n == 0 {
        return Err(changed_elsewhere());
    }
    discord::notify_break(Arc::clone(&st), target_id.to_string(), false);
    Ok(ok_with("กลับเข้าเวรสำเร็จ", json!({ "status": "on_duty" })))
}

pub async fn clock_out(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    payload: Option<Json<DutyActionReq>>,
) -> ApiResult<Value> {
    let target_id = resolve_target(&user, payload.as_ref().map(|p| &p.0))?;
    let s = active_session(&st.db, target_id)
        .await?
        .ok_or_else(|| AppError::BadRequest("คุณยังไม่ได้เข้าเวร".into()))?;

    let queue: Vec<QueueRow> = st
        .db
        .select("queue_status", &[("select", "status,manager_start_time".into()), ("discord_id", eq(target_id))])
        .await?;
    match queue.first().and_then(|q| q.status.as_deref()) {
        Some("story") => return Err(AppError::Conflict("คุณกำลังติดเคสสตอรี่อยู่ กรุณาจบเคสสตอรี่ก่อนออกเวร".into())),
        Some("manager") => return Err(AppError::Conflict("คุณเป็นหมอรันคิวอยู่ กรุณาออกจากหมอรันคิวก่อนออกเวร".into())),
        _ => {}
    }

    // If the break already ran out, the shift ended at the 15-minute mark, not now.
    let now = Utc::now();
    let at = s.break_deadline().filter(|d| *d <= now).unwrap_or(now);
    let closed = duty::close_session(&st.db, &s, at, "in.(on_duty,on_break)")
        .await?
        .ok_or_else(changed_elsewhere)?;

    let _ = manager::clear_queue_for(&st.db, target_id).await;
    discord::notify_clock_out(Arc::clone(&st), target_id.to_string(), closed.duty_minutes, closed.deleted);

    let message = if closed.deleted { "ยกเลิกการเข้าเวรเนื่องจากเวลาไม่ถึง 1 นาที" } else { "ออกเวรสำเร็จ" };
    Ok(ok_with(message, json!({ "deleted": closed.deleted, "total_duty_minutes": closed.duty_minutes })))
}
