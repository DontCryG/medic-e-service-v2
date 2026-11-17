use std::sync::Arc;
use std::time::Duration;
use chrono::{DateTime, Duration as ChronoDuration, FixedOffset, Utc};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tracing::{error, info, warn};

use crate::db::{eq, lt, Db};
use crate::duty_logic::ts;
use crate::error::AppError;
use crate::services::audit;
use crate::services::discord;
use crate::services::duty::{self, Session};
use crate::services::manager;
use crate::state::AppState;

const SETTING_KEY_CONFIG: &str = "db_cleanup_config";
const SETTING_KEY_LAST_RUN: &str = "db_cleanup_last_run";
const SETTING_KEY_LAST_REPORT: &str = "db_cleanup_last_report";

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbCleanupConfig {
    pub auto_enabled: bool,
    pub stale_shift_enabled: bool,
    pub stale_shift_hours: i64,
    pub queue_reset_enabled: bool,
    pub duty_retention_days: i64,
    pub leave_retention_days: i64,
    pub audit_retention_days: i64,
}

impl Default for DbCleanupConfig {
    fn default() -> Self {
        Self {
            auto_enabled: true,
            stale_shift_enabled: true,
            stale_shift_hours: 6,
            queue_reset_enabled: true,
            duty_retention_days: 60,
            leave_retention_days: 90,
            audit_retention_days: 90,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct CleanupReport {
    pub stale_shifts_closed: usize,
    pub queue_reset_count: usize,
    pub duty_logs_purged: usize,
    pub leaves_purged: usize,
    pub audits_purged: usize,
    pub executed_at: String,
    pub trigger_type: String, // "auto" or "manual"
}

#[derive(Deserialize)]
struct SettingRow {
    value: Option<String>,
}

/// Loads configuration from `system_settings`. Falls back to defaults if not found.
pub async fn load_config(db: &Db) -> DbCleanupConfig {
    let rows: Vec<SettingRow> = db
        .select(
            "system_settings",
            &[("select", "value".into()), ("key", eq(SETTING_KEY_CONFIG))],
        )
        .await
        .unwrap_or_default();

    if let Some(row) = rows.into_iter().next() {
        if let Some(raw) = row.value {
            if let Ok(cfg) = serde_json::from_str::<DbCleanupConfig>(&raw) {
                return cfg;
            }
        }
    }
    DbCleanupConfig::default()
}

/// Saves configuration to `system_settings`.
pub async fn save_config(db: &Db, cfg: &DbCleanupConfig) -> Result<(), AppError> {
    let raw = serde_json::to_string(cfg)
        .map_err(|e| AppError::BadRequest(format!("Failed to serialize cleanup config: {e}")))?;

    db.upsert(
        "system_settings",
        "key",
        &json!({
            "key": SETTING_KEY_CONFIG,
            "value": raw,
            "type": "json"
        }),
    )
    .await?;

    Ok(())
}

/// Loads the last execution report.
pub async fn load_last_report(db: &Db) -> (Option<String>, Option<CleanupReport>) {
    let rows: Vec<SettingRow> = db
        .select(
            "system_settings",
            &[
                ("select", "value".into()),
                ("key", eq(SETTING_KEY_LAST_REPORT)),
            ],
        )
        .await
        .unwrap_or_default();

    let last_report = rows.into_iter().next().and_then(|r| {
        r.value.and_then(|v| serde_json::from_str::<CleanupReport>(&v).ok())
    });

    let run_rows: Vec<SettingRow> = db
        .select(
            "system_settings",
            &[
                ("select", "value".into()),
                ("key", eq(SETTING_KEY_LAST_RUN)),
            ],
        )
        .await
        .unwrap_or_default();

    let last_run = run_rows.into_iter().next().and_then(|r| r.value);

    (last_run, last_report)
}

/// Clocks out any active/on_break duty sessions exceeding `max_hours`.
async fn clean_stale_shifts(db: &Db, max_hours: i64) -> Result<usize, AppError> {
    if max_hours <= 0 {
        return Ok(0);
    }
    let now = Utc::now();
    let cutoff = now - ChronoDuration::hours(max_hours);
    let cutoff_str = ts(cutoff);

    let stale_sessions: Vec<Session> = db
        .select(
            "duty_logs",
            &[
                ("select", "id,discord_id,status,clock_in,last_break_start,total_break_minutes".into()),
                ("status", "in.(on_duty,on_break)".into()),
                ("clock_in", lt(&cutoff_str)),
            ],
        )
        .await
        .unwrap_or_default();

    let mut closed_count = 0;
    for s in stale_sessions {
        // Cap duty duration at max_hours
        let end_time = s.clock_in + ChronoDuration::hours(max_hours);
        let capped_end = if end_time < now { end_time } else { now };

        match duty::close_session(db, &s, capped_end, "in.(on_duty,on_break)").await {
            Ok(Some(_)) => {
                info!("🧹 [Auto-Cleanup] Auto closed stale shift for doctor: {}", s.discord_id);
                closed_count += 1;
            }
            Ok(None) => {}
            Err(e) => {
                warn!("⚠️ [Auto-Cleanup] Failed to close stale shift for {}: {e:?}", s.discord_id);
            }
        }
    }

    Ok(closed_count)
}

/// Resets regular doctors' queue and finalizes any active queue manager sessions.
async fn reset_queue_state(db: &Db) -> Result<usize, AppError> {
    let now = Utc::now();

    // 1. Find active queue manager to record history
    #[derive(Deserialize)]
    struct ManagerRow {
        discord_id: String,
        manager_start_time: Option<DateTime<Utc>>,
    }

    let managers: Vec<ManagerRow> = db
        .select(
            "queue_status",
            &[
                ("select", "discord_id,manager_start_time".into()),
                ("status", eq("manager")),
            ],
        )
        .await
        .unwrap_or_default();

    for m in managers {
        if let Some(start) = m.manager_start_time {
            let _ = manager::save_manager_history(db, &m.discord_id, start).await;
        }
    }

    // 2. Clear all active queue statuses
    let reset_count = db
        .update(
            "queue_status",
            &[("status", "in.(queued,manager,unavailable)".into())],
            &json!({ "status": Value::Null, "updated_at": ts(now) }),
        )
        .await
        .unwrap_or(0);

    // 3. Clear queue volunteers
    let _ = db
        .update(
            "system_settings",
            &[("key", eq("queue_volunteers"))],
            &json!({ "value": "[]" }),
        )
        .await;

    Ok(reset_count)
}

/// Purges completed duty logs older than `retention_days`.
async fn purge_duty_logs(db: &Db, retention_days: i64) -> Result<usize, AppError> {
    if retention_days <= 0 {
        return Ok(0);
    }
    let cutoff = Utc::now() - ChronoDuration::days(retention_days);
    let cutoff_str = ts(cutoff);

    let count = db
        .delete(
            "duty_logs",
            &[
                ("status", eq("completed")),
                ("clock_out", lt(&cutoff_str)),
            ],
        )
        .await
        .unwrap_or(0);

    Ok(count)
}

/// Purges finalized leave requests older than `retention_days`.
async fn purge_leave_requests(db: &Db, retention_days: i64) -> Result<usize, AppError> {
    if retention_days <= 0 {
        return Ok(0);
    }
    let cutoff = Utc::now() - ChronoDuration::days(retention_days);
    let cutoff_str = ts(cutoff);

    let count = db
        .delete(
            "leave_requests",
            &[
                ("status", "in.(approved,rejected)".into()),
                ("end_date", lt(&cutoff_str)),
            ],
        )
        .await
        .unwrap_or(0);

    Ok(count)
}

/// Purges audit logs older than `retention_days`.
async fn purge_audit_logs(db: &Db, retention_days: i64) -> Result<usize, AppError> {
    if retention_days <= 0 {
        return Ok(0);
    }
    let cutoff = Utc::now() - ChronoDuration::days(retention_days);
    let cutoff_str = ts(cutoff);

    let count = db
        .delete(
            "audit_logs",
            &[("created_at", lt(&cutoff_str))],
        )
        .await
        .unwrap_or(0);

    Ok(count)
}

/// Executes a complete cleanup run according to configuration.
pub async fn execute_cleanup(
    state: &Arc<AppState>,
    cfg: &DbCleanupConfig,
    is_manual: bool,
    force_queue_reset: bool,
) -> Result<CleanupReport, AppError> {
    let now = Utc::now();
    let db = &state.db;

    info!(
        "🧹 [DbCleanup] Starting cleanup run (manual={}, auto_enabled={})",
        is_manual, cfg.auto_enabled
    );

    let mut report = CleanupReport {
        executed_at: ts(now),
        trigger_type: if is_manual { "manual".to_string() } else { "auto".to_string() },
        ..Default::default()
    };

    // 1. Clean Stale Shifts
    if cfg.stale_shift_enabled || is_manual {
        match clean_stale_shifts(db, cfg.stale_shift_hours).await {
            Ok(count) => report.stale_shifts_closed = count,
            Err(e) => warn!("⚠️ [DbCleanup] Failed stale shifts cleanup: {e:?}"),
        }
    }

    // 2. Queue Reset (if manual requested or daily condition met)
    if force_queue_reset {
        match reset_queue_state(db).await {
            Ok(count) => report.queue_reset_count = count,
            Err(e) => warn!("⚠️ [DbCleanup] Failed queue reset: {e:?}"),
        }
    }

    // 3. Purge Duty Logs
    if cfg.duty_retention_days > 0 {
        match purge_duty_logs(db, cfg.duty_retention_days).await {
            Ok(count) => report.duty_logs_purged = count,
            Err(e) => warn!("⚠️ [DbCleanup] Failed duty logs purge: {e:?}"),
        }
    }

    // 4. Purge Leave Requests
    if cfg.leave_retention_days > 0 {
        match purge_leave_requests(db, cfg.leave_retention_days).await {
            Ok(count) => report.leaves_purged = count,
            Err(e) => warn!("⚠️ [DbCleanup] Failed leave requests purge: {e:?}"),
        }
    }

    // 5. Purge Audit Logs
    if cfg.audit_retention_days > 0 {
        match purge_audit_logs(db, cfg.audit_retention_days).await {
            Ok(count) => report.audits_purged = count,
            Err(e) => warn!("⚠️ [DbCleanup] Failed audit logs purge: {e:?}"),
        }
    }

    // 6. Record last run metadata
    let report_json = serde_json::to_string(&report).unwrap_or_default();
    let _ = db
        .upsert(
            "system_settings",
            "key",
            &json!({
                "key": SETTING_KEY_LAST_RUN,
                "value": ts(now),
                "type": "text"
            }),
        )
        .await;

    let _ = db
        .upsert(
            "system_settings",
            "key",
            &json!({
                "key": SETTING_KEY_LAST_REPORT,
                "value": report_json,
                "type": "json"
            }),
        )
        .await;

    // 7. Audit log & Discord Notification
    let total_cleaned = report.stale_shifts_closed
        + report.queue_reset_count
        + report.duty_logs_purged
        + report.leaves_purged
        + report.audits_purged;

    if total_cleaned > 0 || is_manual {
        audit::log_action(
            db,
            if is_manual { "admin" } else { "system_cron" },
            Some("Database Auto-Cleaner"),
            "DB_CLEANUP",
            "database",
            None,
            Some(&serde_json::to_value(&report).unwrap_or(Value::Null)),
        )
        .await;

        let desc = format!(
            "🧹 **ผลการทำความสะอาดฐานข้อมูล ({})**\n\
             • เคลียร์เวรค้าง: **{}** รายการ\n\
             • รีเซ็ตคิวแพทย์: **{}** คน\n\
             • ลบประวัติเวรเก่า (>{} วัน): **{}** รายการ\n\
             • ลบคำขอลางานเก่า (>{} วัน): **{}** รายการ\n\
             • ลบ Audit Logs เก่า (>{} วัน): **{}** รายการ",
            if is_manual { "สั่งการโดยผู้ดูแลระบบ" } else { "ระบบอัตโนมัติ" },
            report.stale_shifts_closed,
            report.queue_reset_count,
            cfg.duty_retention_days,
            report.duty_logs_purged,
            cfg.leave_retention_days,
            report.leaves_purged,
            cfg.audit_retention_days,
            report.audits_purged
        );

        discord::notify_leave_event(
            Arc::clone(state),
            "✨ บันทึกการทำความสะอาดฐานข้อมูล (Database Cleanup)".to_string(),
            desc,
            0x10b981, // Emerald green
        );
    }

    info!(
        "✅ [DbCleanup] Completed: {} stale closed, {} queue reset, {} duty purged, {} leaves purged, {} audits purged",
        report.stale_shifts_closed,
        report.queue_reset_count,
        report.duty_logs_purged,
        report.leaves_purged,
        report.audits_purged
    );

    Ok(report)
}

/// Bangkok midnight check helper
fn is_bangkok_midnight_window(now: DateTime<Utc>) -> bool {
    let bkk = FixedOffset::east_opt(7 * 3600).unwrap();
    let bkk_time = now.with_timezone(&bkk);
    // Between 00:00 and 00:15 Bangkok time
    bkk_time.hour() == 0 && bkk_time.minute() < 16
}

/// Trait to access hour and minute easily
use chrono::Timelike;

/// Starts the 24/7 background worker loop.
pub fn start_cleanup_worker(state: Arc<AppState>) {
    tokio::spawn(async move {
        info!("🧹 Database auto-cleanup background worker started (checking every 15m)");
        let mut interval = tokio::time::interval(Duration::from_secs(15 * 60));
        let mut last_midnight_reset_date = String::new();

        loop {
            interval.tick().await;

            let cfg = load_config(&state.db).await;
            if !cfg.auto_enabled {
                continue;
            }

            let now = Utc::now();
            let bkk = FixedOffset::east_opt(7 * 3600).unwrap();
            let today_bkk_str = now.with_timezone(&bkk).format("%Y-%m-%d").to_string();

            let should_reset_queue = cfg.queue_reset_enabled
                && is_bangkok_midnight_window(now)
                && last_midnight_reset_date != today_bkk_str;

            if should_reset_queue {
                last_midnight_reset_date = today_bkk_str;
            }

            if let Err(e) = execute_cleanup(&state, &cfg, false, should_reset_queue).await {
                error!("❌ [DbCleanup Worker] Error during scheduled cleanup: {e:?}");
            }
        }
    });
}
