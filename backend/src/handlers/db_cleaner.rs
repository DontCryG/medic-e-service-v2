use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};

use crate::auth::AuthUser;
use crate::error::{ok_with, ApiResponse, AppError};
use crate::services::db_cleaner::{self, CleanupReport, DbCleanupConfig};
use crate::state::AppState;

type ApiResult<T> = Result<Json<ApiResponse<T>>, AppError>;

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanupStatusResponse {
    pub config: DbCleanupConfig,
    pub last_run: Option<String>,
    pub last_report: Option<CleanupReport>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CleanNowReq {
    pub reset_queue: Option<bool>,
}

/// GET /api/admin/db/cleanup-status
pub async fn get_cleanup_status(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
) -> ApiResult<CleanupStatusResponse> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    let config = db_cleaner::load_config(&st.db).await;
    let (last_run, last_report) = db_cleaner::load_last_report(&st.db).await;

    Ok(ok_with(
        "ดึงข้อมูลสถานะการทำความสะอาดฐานข้อมูลสำเร็จ",
        CleanupStatusResponse {
            config,
            last_run,
            last_report,
        },
    ))
}

/// POST /api/admin/db/cleanup-config
pub async fn update_cleanup_config(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    Json(cfg): Json<DbCleanupConfig>,
) -> ApiResult<DbCleanupConfig> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    db_cleaner::save_config(&st.db, &cfg).await?;

    Ok(ok_with(
        "บันทึกการตั้งค่านโยบายทำความสะอาดฐานข้อมูลสำเร็จ",
        cfg,
    ))
}

/// POST /api/admin/db/clean-now
pub async fn trigger_clean_now(
    State(st): State<Arc<AppState>>,
    user: AuthUser,
    payload: Option<Json<CleanNowReq>>,
) -> ApiResult<CleanupReport> {
    if !user.is_admin() {
        return Err(AppError::Forbidden);
    }

    let cfg = db_cleaner::load_config(&st.db).await;
    let force_queue = payload.and_then(|p| p.reset_queue).unwrap_or(false);

    let report = db_cleaner::execute_cleanup(&st, &cfg, true, force_queue).await?;

    Ok(ok_with(
        "ทำความสะอาดและจัดระเบียบฐานข้อมูลเรียบร้อยแล้ว",
        report,
    ))
}
