use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{info, warn};

use crate::db::Db;
use crate::duty_logic::ts;
use crate::error::AppError;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AuditLogRow {
    pub id: Option<String>,
    pub actor_discord_id: String,
    pub actor_name: Option<String>,
    pub action: String,
    pub target_type: String,
    pub target_id: Option<String>,
    pub details: Option<Value>,
    pub created_at: Option<DateTime<Utc>>,
}

/// Logs an audit trail event. If the database table does not exist or fails, logs to tracing safely.
pub async fn log_action(
    db: &Db,
    actor_id: &str,
    actor_name: Option<&str>,
    action: &str,
    target_type: &str,
    target_id: Option<&str>,
    details: Option<&Value>,
) {
    let now = Utc::now();
    info!(
        "🔒 [Audit] Actor: {} ({:?}) | Action: {} | Target: {}:{:?} | Details: {:?}",
        actor_id, actor_name, action, target_type, target_id, details
    );

    let payload = json!({
        "actor_discord_id": actor_id,
        "actor_name": actor_name,
        "action": action,
        "target_type": target_type,
        "target_id": target_id,
        "details": details,
        "created_at": ts(now)
    });

    if let Err(e) = db.insert("audit_logs", &payload).await {
        warn!("Failed to persist audit log into audit_logs table (run create_audit_logs.sql if table missing): {e:?}");
    }
}

pub async fn list_audit_logs(
    db: &Db,
    limit: usize,
    offset: usize,
) -> Result<Vec<AuditLogRow>, AppError> {
    let limit_str = limit.to_string();
    let offset_str = offset.to_string();

    let rows: Vec<AuditLogRow> = db
        .select(
            "audit_logs",
            &[
                ("select", "*".into()),
                ("order", "created_at.desc".into()),
                ("limit", limit_str),
                ("offset", offset_str),
            ],
        )
        .await
        .unwrap_or_default();

    Ok(rows)
}
