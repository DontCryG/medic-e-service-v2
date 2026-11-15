use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;
use tracing::info;

pub async fn health_check() -> impl IntoResponse {
    info!("💓 [Health Check] Incoming health probe");
    Json(json!({
        "status": "healthy",
        "service": "medic-e-service-backend",
        "runtime": "Rust Axum + Tokio",
        "version": env!("CARGO_PKG_VERSION"),
        "timestamp": chrono::Utc::now().to_rfc3339()
    }))
}
