use std::sync::Arc;
use axum::extract::State;
use axum::Json;
use serde_json::Value;

use crate::services::discord_bot::handle_interaction;
use crate::state::AppState;

pub async fn discord_interactions_endpoint(
    State(st): State<Arc<AppState>>,
    Json(payload): Json<Value>,
) -> Json<Value> {
    let response = handle_interaction(&st, &payload).await;
    Json(response)
}
