use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use tracing::{info, warn};

use crate::auth::AuthUser;
use crate::db::{eq, neq};
use crate::duty_logic::ts;
use crate::error::{ok, ApiResponse, AppError};
use crate::services::manager::{self, save_manager_history, QueueRow};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize)]
pub struct UpdateStatusReq {
    pub status: Option<String>,
    pub target_discord_id: Option<String>,
}

#[derive(Deserialize, Default)]
pub struct TargetReq {
    pub target_discord_id: Option<String>,
}

fn resolve_target<'a>(user: &'a AuthUser, target: Option<&'a str>) -> Result<&'a str, AppError> {
    match target {
        Some(t) if t != user.discord_id => {
            if !user.is_admin() {
                return Err(AppError::Forbidden);
            }
            Ok(t)
        }
        _ => Ok(&user.discord_id),
    }
}

pub async fn clear_other_queued(st: &AppState, exclude_discord_id: &str) -> Result<(), AppError> {
    // 1. Reset regular doctors who are currently queued
    st.db
        .update(
            "queue_status",
            &[("status", eq("queued")), ("discord_id", neq(exclude_discord_id))],
            &json!({ "status": Value::Null, "updated_at": ts(Utc::now()) }),
        )
        .await?;

    // 2. Clear volunteers in system_settings if any volunteer is currently queued
    #[derive(Deserialize)]
    struct SettingRow {
        value: Option<String>,
    }

    let rows: Vec<SettingRow> = st
        .db
        .select("system_settings", &[("select", "value".into()), ("key", eq("queue_volunteers"))])
        .await
        .unwrap_or_default();

    if let Some(row) = rows.first() {
        if let Some(val_str) = &row.value {
            if let Ok(mut volunteers) = serde_json::from_str::<Vec<Value>>(val_str) {
                let mut changed = false;
                for v in &mut volunteers {
                    if v.get("status").and_then(|s| s.as_str()) == Some("queued")
                        && v.get("id").and_then(|i| i.as_str()) != Some(exclude_discord_id)
                    {
                        v["status"] = Value::Null;
                        changed = true;
                    }
                }
                if changed {
                    let updated_json = serde_json::to_string(&volunteers).unwrap_or_default();
                    let _ = st.db.upsert(
                        "system_settings",
                        "key",
                        &json!({
                            "key": "queue_volunteers",
                            "value": updated_json,
                            "description": "ข้อมูลหมออาสา",
                            "type": "json"
                        }),
                    ).await;
                }
            }
        }
    }

    Ok(())
}

pub async fn update_status(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<UpdateStatusReq>,
) -> ApiResult<()> {
    let target_id = payload
        .target_discord_id
        .as_deref()
        .filter(|t| !t.is_empty())
        .unwrap_or(&user.discord_id);
    let new_status = payload.status.as_deref().filter(|s| !s.is_empty());

    // Fetch existing queue_status
    let rows: Vec<QueueRow> = st
        .db
        .select(
            "queue_status",
            &[("select", "status,manager_start_time".into()), ("discord_id", eq(target_id))],
        )
        .await?;
    let existing = rows.first();

    // Permission check:
    // 1. Any user can set/unset their own status.
    // 2. Admin can set/unset any status for any doctor.
    // 3. Any user can toggle "unavailable" for other doctors.
    // 4. Active Queue Manager can toggle "queued" (พร้อมรับคิว) for other doctors.
    // 5. Setting "manager" for other doctors still requires admin privilege.
    if target_id != user.discord_id && !user.is_admin() {
        let is_toggling_unavailable = match new_status {
            Some("unavailable") => true,
            None => existing.and_then(|r| r.status.as_deref()) == Some("unavailable"),
            _ => false,
        };

        let mut is_allowed = is_toggling_unavailable;

        if !is_allowed {
            let caller_rows: Vec<QueueRow> = st
                .db
                .select(
                    "queue_status",
                    &[
                        ("select", "status,manager_start_time".into()),
                        ("discord_id", eq(&user.discord_id)),
                    ],
                )
                .await
                .unwrap_or_default();

            let caller_is_manager = caller_rows
                .first()
                .and_then(|r| r.status.as_deref()) == Some("manager");

            if caller_is_manager {
                let is_toggling_queued = match new_status {
                    Some("queued") => true,
                    None => existing.and_then(|r| r.status.as_deref()) == Some("queued"),
                    _ => false,
                };
                if is_toggling_queued {
                    is_allowed = true;
                }
            }
        }

        if !is_allowed {
            return Err(AppError::Forbidden);
        }
    }

    // If leaving manager, record history
    if let Some(row) = existing {
        if let (Some("manager"), Some(start)) = (row.status.as_deref(), row.manager_start_time) {
            if new_status != Some("manager") {
                if let Err(e) = save_manager_history(&st.db, target_id, start).await {
                    warn!("Failed to save manager history for {target_id}: {e:?}");
                }
            }
        }
    }

    let now = Utc::now();

    match new_status {
        None => {
            // Nullify status while preserving remarks
            st.db
                .update(
                    "queue_status",
                    &[("discord_id", eq(target_id))],
                    &json!({
                        "status": Value::Null,
                        "manager_start_time": Value::Null,
                        "updated_at": ts(now)
                    }),
                )
                .await?;
        }
        Some("queued") => {
            // Guarantee only one doctor can be queued at a time
            clear_other_queued(&st, target_id).await?;
            st.db
                .upsert(
                    "queue_status",
                    "discord_id",
                    &json!({
                        "discord_id": target_id,
                        "status": "queued",
                        "updated_at": ts(now)
                    }),
                )
                .await?;
        }
        Some("manager") => {
            let manager_start = existing
                .and_then(|r| if r.status.as_deref() == Some("manager") { r.manager_start_time } else { None })
                .unwrap_or(now);

            st.db
                .upsert(
                    "queue_status",
                    "discord_id",
                    &json!({
                        "discord_id": target_id,
                        "status": "manager",
                        "manager_start_time": ts(manager_start),
                        "updated_at": ts(now)
                    }),
                )
                .await?;
        }
        Some(other) => {
            st.db
                .upsert(
                    "queue_status",
                    "discord_id",
                    &json!({
                        "discord_id": target_id,
                        "status": other,
                        "updated_at": ts(now)
                    }),
                )
                .await?;
        }
    }

    info!("📋 [Queue] Doctor {target_id} updated status to {new_status:?}");
    Ok(ok("อัปเดตสถานะคิวสำเร็จ"))
}

pub async fn clear_queue(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    payload: Option<Json<TargetReq>>,
) -> ApiResult<()> {
    let target_id = resolve_target(&user, payload.as_ref().and_then(|p| p.target_discord_id.as_deref()))?;
    manager::clear_queue_for(&st.db, target_id).await?;
    info!("📋 [Queue] Doctor {target_id} cleared queue status");
    Ok(ok("เคลียร์สถานะคิวเรียบร้อย"))
}
