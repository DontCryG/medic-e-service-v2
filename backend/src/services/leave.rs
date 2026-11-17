use std::sync::Arc;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::json;

use crate::db;
use crate::duty_logic::ts;
use crate::error::AppError;
use crate::services::audit::log_action;
use crate::services::discord::notify_leave_event;
use crate::state::AppState;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeaveRecord {
    pub id: String,
    pub discord_id: String,
    pub leave_type: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub reason: String,
    pub status: Option<String>,
    pub approved_by: Option<String>,
    pub admin_comment: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

pub async fn submit_leave(
    st: Arc<AppState>,
    discord_id: &str,
    user_name: &str,
    leave_type: &str,
    start_str: &str,
    end_str: &str,
    reason: &str,
) -> Result<(), AppError> {
    let start_dt = start_str
        .parse::<DateTime<Utc>>()
        .map_err(|_| AppError::BadRequest("รูปแบบ start_date ไม่ถูกต้อง".into()))?;
    let end_dt = end_str
        .parse::<DateTime<Utc>>()
        .map_err(|_| AppError::BadRequest("รูปแบบ end_date ไม่ถูกต้อง".into()))?;

    if start_dt > end_dt {
        return Err(AppError::BadRequest("วันเริ่มต้นต้องมาก่อนวันสิ้นสุด".into()));
    }

    // 1. Overlapping leave check: look for pending or approved leaves for this user
    let existing_leaves: Vec<LeaveRecord> = st
        .db
        .select(
            "leave_requests",
            &[
                ("discord_id", db::eq(discord_id)),
                ("status", db::neq("rejected")),
                ("start_date", db::lte(end_str)),
                ("end_date", db::gte(start_str)),
            ],
        )
        .await
        .unwrap_or_default();

    if !existing_leaves.is_empty() {
        return Err(AppError::Conflict("คุณมีคำขอลาที่ทับซ้อนกับช่วงเวลานี้อยู่แล้ว".into()));
    }

    let now = Utc::now();
    let body = json!({
        "discord_id": discord_id,
        "leave_type": leave_type,
        "start_date": ts(start_dt),
        "end_date": ts(end_dt),
        "reason": reason,
        "status": "pending",
        "created_at": ts(now)
    });

    st.db.insert("leave_requests", &body).await?;

    // 2. Notify Admins in notifications table
    let leave_label = match leave_type {
        "vacation" => "พักร้อน",
        "resign" => "ลาออก",
        _ => "ลากิจ",
    };
    let notif_body = json!({
        "discord_id": "ALL_ADMINS",
        "title": "ใบลาใหม่ (รออนุมัติ)",
        "message": format!("คุณ {user_name} ยื่นใบลา{leave_label} เหตุผล: {reason}"),
        "type": "leave_request",
        "link": "/leave",
        "created_at": ts(now)
    });
    let _ = st.db.insert("notifications", &notif_body).await;

    // 3. Discord Webhook Notification
    notify_leave_event(
        Arc::clone(&st),
        format!("📋 ยื่นใบลาใหม่ ({leave_label})"),
        format!("**แพทย์:** {user_name} (<@{discord_id}>)\n**ช่วงเวลา:** {start_str} ถึง {end_str}\n**เหตุผล:** {reason}"),
        15844367, // Gold/Orange
    );

    // 4. Audit Log
    log_action(
        &st.db,
        discord_id,
        Some(user_name),
        "LEAVE_REQUEST",
        "leave_request",
        None,
        Some(&json!({
            "leave_type": leave_type,
            "start_date": start_str,
            "end_date": end_str,
            "reason": reason
        })),
    ).await;

    Ok(())
}

pub async fn review_leave(
    st: Arc<AppState>,
    admin_id: &str,
    admin_name: &str,
    request_id: &str,
    new_status: &str,
    admin_comment: Option<&str>,
) -> Result<(), AppError> {
    if new_status != "approved" && new_status != "rejected" {
        return Err(AppError::BadRequest("สถานะต้องเป็น approved หรือ rejected".into()));
    }

    let existing: Vec<LeaveRecord> = st
        .db
        .select("leave_requests", &[("id", db::eq(request_id))])
        .await?;

    let leave = match existing.first() {
        Some(l) => l,
        None => return Err(AppError::BadRequest("ไม่พบใบลาที่ระบุ".into())),
    };

    let now = Utc::now();
    let update_body = json!({
        "status": new_status,
        "approved_by": admin_name,
        "admin_comment": admin_comment,
    });

    st.db.update("leave_requests", &[("id", db::eq(request_id))], &update_body).await?;

    // In-app notification to requester
    let notif_title = if new_status == "approved" {
        "ใบลาของคุณได้รับการอนุมัติแล้ว"
    } else {
        "ใบลาของคุณไม่ได้รับการอนุมัติ"
    };

    let notif_msg = if new_status == "approved" {
        format!("คำขอลาของคุณได้รับการอนุมัติโดย {admin_name} เรียบร้อยแล้ว")
    } else {
        format!(
            "คำขอลาของคุณถูกปฏิเสธโดย {admin_name}{}",
            admin_comment.map(|c| format!(" (เหตุผล: {c})")).unwrap_or_default()
        )
    };

    let notif_body = json!({
        "discord_id": leave.discord_id,
        "title": notif_title,
        "message": notif_msg,
        "type": "leave_result",
        "link": "/leave",
        "created_at": ts(now)
    });
    let _ = st.db.insert("notifications", &notif_body).await;

    // Discord Announcement
    let (status_label, color) = if new_status == "approved" {
        ("อนุมัติแล้ว", 3066993) // Green
    } else {
        ("ปฏิเสธ", 15158332) // Red
    };

    notify_leave_event(
        Arc::clone(&st),
        format!("⚖️ ผลการพิจารณาใบลา ({status_label})"),
        format!(
            "**แพทย์:** <@{}>\n**ผลการพิจารณา:** {}\n**ผู้พิจารณา:** {admin_name}{}",
            leave.discord_id,
            status_label,
            admin_comment.map(|c| format!("\n**หมายเหตุ:** {c}")).unwrap_or_default()
        ),
        color,
    );

    // Audit Trail
    let audit_action = if new_status == "approved" { "LEAVE_APPROVE" } else { "LEAVE_REJECT" };
    log_action(
        &st.db,
        admin_id,
        Some(admin_name),
        audit_action,
        "leave_request",
        Some(request_id),
        Some(&json!({
            "target_user": leave.discord_id,
            "status": new_status,
            "comment": admin_comment
        })),
    ).await;

    Ok(())
}

pub async fn delete_leave(
    st: Arc<AppState>,
    user_id: &str,
    user_name: &str,
    is_admin: bool,
    request_id: &str,
) -> Result<(), AppError> {
    let existing: Vec<LeaveRecord> = st
        .db
        .select("leave_requests", &[("id", db::eq(request_id))])
        .await?;

    let leave = match existing.first() {
        Some(l) => l,
        None => return Err(AppError::BadRequest("ไม่พบใบลาที่ระบุ".into())),
    };

    if !is_admin && leave.discord_id != user_id {
        return Err(AppError::Forbidden);
    }

    st.db.delete("leave_requests", &[("id", db::eq(request_id))]).await?;

    log_action(
        &st.db,
        user_id,
        Some(user_name),
        "LEAVE_DELETE",
        "leave_request",
        Some(request_id),
        Some(&json!({ "deleted_leave_user": leave.discord_id })),
    ).await;

    Ok(())
}
