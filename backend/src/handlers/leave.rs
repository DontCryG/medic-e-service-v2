use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use crate::auth::AuthUser;
use crate::error::{ok, ApiResponse, AppError};
use crate::services::leave::{delete_leave, review_leave, submit_leave};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize)]
pub struct CreateLeaveReq {
    pub leave_type: String,
    pub start_date: String,
    pub end_date: String,
    pub reason: String,
}

#[derive(Deserialize)]
pub struct ReviewLeaveReq {
    pub id: String,
    pub status: String,
    pub admin_comment: Option<String>,
}

#[derive(Deserialize)]
pub struct DeleteLeaveReq {
    pub id: String,
}

pub async fn request_leave(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<CreateLeaveReq>,
) -> ApiResult<()> {
    if payload.reason.trim().is_empty() {
        return Err(AppError::BadRequest("กรุณาระบุเหตุผลการลา".into()));
    }

    submit_leave(
        Arc::clone(&st),
        &user.discord_id,
        &user.ic_name,
        &payload.leave_type,
        &payload.start_date,
        &payload.end_date,
        &payload.reason,
    )
    .await?;

    Ok(ok("ยื่นใบลาสำเร็จ"))
}

pub async fn review_leave_status(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<ReviewLeaveReq>,
) -> ApiResult<()> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    review_leave(
        Arc::clone(&st),
        &user.discord_id,
        &user.ic_name,
        &payload.id,
        &payload.status,
        payload.admin_comment.as_deref(),
    )
    .await?;

    Ok(ok("อัปเดตสถานะใบลาสำเร็จ"))
}

pub async fn delete_leave_item(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(payload): Json<DeleteLeaveReq>,
) -> ApiResult<()> {
    delete_leave(
        Arc::clone(&st),
        &user.discord_id,
        &user.ic_name,
        user.is_admin(),
        &payload.id,
    )
    .await?;

    Ok(ok("ลบใบลาสำเร็จ"))
}
