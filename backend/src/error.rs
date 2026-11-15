use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::Json;
use serde::Serialize;
use tracing::error;

#[derive(Serialize)]
pub struct ApiResponse<T: Serialize> {
    pub success: bool,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<T>,
}

pub fn ok(message: &str) -> Json<ApiResponse<()>> {
    Json(ApiResponse { success: true, message: message.to_string(), data: None })
}

pub fn ok_with<T: Serialize>(message: &str, data: T) -> Json<ApiResponse<T>> {
    Json(ApiResponse { success: true, message: message.to_string(), data: Some(data) })
}

#[derive(Debug)]
pub enum AppError {
    Unauthorized,
    Forbidden,
    BadRequest(String),
    Conflict(String),
    /// Supabase failed. Details are logged, never sent to the browser.
    Upstream(String),
}

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            AppError::Unauthorized => (StatusCode::UNAUTHORIZED, "กรุณาเข้าสู่ระบบใหม่".to_string()),
            AppError::Forbidden => (StatusCode::FORBIDDEN, "คุณไม่มีสิทธิ์ใช้งานส่วนนี้".to_string()),
            AppError::BadRequest(m) => (StatusCode::BAD_REQUEST, m),
            AppError::Conflict(m) => (StatusCode::CONFLICT, m),
            AppError::Upstream(detail) => {
                error!("supabase error: {detail}");
                (StatusCode::BAD_GATEWAY, "ระบบฐานข้อมูลขัดข้อง กรุณาลองใหม่".to_string())
            }
        };
        (status, Json(ApiResponse::<()> { success: false, message, data: None })).into_response()
    }
}

impl From<reqwest::Error> for AppError {
    fn from(e: reqwest::Error) -> Self {
        AppError::Upstream(e.to_string())
    }
}
