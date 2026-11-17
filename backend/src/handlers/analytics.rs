use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use serde::Deserialize;

use crate::auth::AuthUser;
use crate::error::{ok_with, ApiResponse, AppError};
use crate::services::analytics::{compute_analytics_summary, AnalyticsSummary};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize)]
pub struct AnalyticsSummaryReq {
    pub start_date: String,
    pub end_date: String,
}

pub async fn get_analytics_summary(
    State(st): State<Arc<AppState>>,
    _user: AuthUser,
    Json(payload): Json<AnalyticsSummaryReq>,
) -> ApiResult<AnalyticsSummary> {
    if payload.start_date.is_empty() || payload.end_date.is_empty() {
        return Err(AppError::BadRequest("กรุณาระบุช่วงวันที่เริ่มต้นและสิ้นสุด".into()));
    }

    let summary = compute_analytics_summary(&st.db, &payload.start_date, &payload.end_date).await?;
    Ok(ok_with("ประมวลผลสถิติสำเร็จ", summary))
}
