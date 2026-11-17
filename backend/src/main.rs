mod auth;
mod config;
mod db;
mod duty_logic;
mod error;
mod handlers;
mod services;
mod state;

use std::net::SocketAddr;
use std::sync::Arc;
use axum::http::{header, HeaderValue, Method};
use axum::routing::{get, post};
use axum::Router;
use tower_http::cors::{AllowOrigin, CorsLayer};
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::handlers::{admin, analytics, audit, db_cleaner, discord_bot, duty, health, leave, queue, salary};
use crate::services::break_watchdog::start_break_watchdog;
use crate::services::db_cleaner::start_cleanup_worker;
use crate::services::discord_bot::register_slash_commands_if_configured;
use crate::state::AppState;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "backend=info,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env();
    let state = Arc::new(AppState::new(&config));

    start_break_watchdog(Arc::clone(&state));
    start_cleanup_worker(Arc::clone(&state));

    let bot_state = Arc::clone(&state);
    tokio::spawn(async move {
        register_slash_commands_if_configured(&bot_state).await;
    });

    // Login uses a Bearer token (not cookies), so "*" is safe for development.
    // Set CORS_ORIGIN to the real site URL in production.
    let origin = match config.cors_origin.as_str() {
        "*" => AllowOrigin::any(),
        o => AllowOrigin::exact(HeaderValue::from_str(o).expect("CORS_ORIGIN is not a valid origin")),
    };
    let cors = CorsLayer::new()
        .allow_origin(origin)
        .allow_methods([Method::GET, Method::POST, Method::OPTIONS])
        .allow_headers([header::CONTENT_TYPE, header::AUTHORIZATION]);

    let app = Router::new()
        .route("/api/health", get(health::health_check))
        .route("/api/duty/clock-in", post(duty::clock_in))
        .route("/api/duty/toggle-break", post(duty::toggle_break))
        .route("/api/duty/clock-out", post(duty::clock_out))
        .route("/api/queue/status", post(queue::update_status))
        .route("/api/queue/clear", post(queue::clear_queue))
        .route("/api/admin/user/delete", post(admin::delete_user))
        .route("/api/admin/audit-logs", get(audit::get_audit_logs))
        .route("/api/leave/request", post(leave::request_leave))
        .route("/api/leave/review", post(leave::review_leave_status))
        .route("/api/leave/delete", post(leave::delete_leave_item))
        .route("/api/salary/calculate", post(salary::calculate_salary))
        .route("/api/analytics/summary", post(analytics::get_analytics_summary))
        .route("/api/discord/interactions", post(discord_bot::discord_interactions_endpoint))
        .route("/api/admin/db/cleanup-status", get(db_cleaner::get_cleanup_status))
        .route("/api/admin/db/cleanup-config", post(db_cleaner::update_cleanup_config))
        .route("/api/admin/db/clean-now", post(db_cleaner::trigger_clean_now))
        .with_state(state)
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind TCP listener");
    info!("Rust backend listening on http://{addr}");
    axum::serve(listener, app).await.expect("Server crashed");
}
