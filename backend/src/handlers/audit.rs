use std::sync::Arc;
use axum::extract::{Query, State};
use axum::Json;
use serde::Deserialize;

use crate::auth::AuthUser;
use crate::error::{ok_with, ApiResponse, AppError};
use crate::services::audit::{list_audit_logs, AuditLogRow};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Deserialize)]
pub struct AuditQuery {
    pub limit: Option<usize>,
    pub offset: Option<usize>,
}

pub async fn get_audit_logs(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Query(query): Query<AuditQuery>,
) -> ApiResult<Vec<AuditLogRow>> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    let limit = query.limit.unwrap_or(50).min(200);
    let offset = query.offset.unwrap_or(0);

    let logs = list_audit_logs(&st.db, limit, offset).await?;
    Ok(ok_with("ดึงข้อมูลบันทึกความปลอดภัยสำเร็จ", logs))
}
