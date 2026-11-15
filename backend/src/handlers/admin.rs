use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use serde::Deserialize;
use tracing::info;

use crate::auth::AuthUser;
use crate::db::eq;
use crate::error::{ok, ApiResponse, AppError};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize)]
pub struct DeleteUserReq {
    pub target_discord_id: String,
}

pub async fn delete_user(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<DeleteUserReq>,
) -> ApiResult<()> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    let target_id = payload.target_discord_id.trim();
    if target_id.is_empty() {
        return Err(AppError::BadRequest("Target Discord ID is required".into()));
    }

    // 1. Delete all child references across system tables first (Zero FK Violation)
    let _ = st.db.delete("queue_status", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("duty_logs", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("queue_manager_logs", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("story_logs", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("leave_requests", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("accounting_logs", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("inventory_logs", &[("discord_id", eq(target_id))]).await;
    let _ = st.db.delete("notifications", &[("discord_id", eq(target_id))]).await;

    // 2. Delete user record from users table
    st.db.delete("users", &[("discord_id", eq(target_id))]).await?;

    info!("🗑️ [Admin] Personnel {target_id} deleted successfully by admin {}", user.discord_id);
    Ok(ok("ลบข้อมูลบุคลากรสำเร็จ"))
}
