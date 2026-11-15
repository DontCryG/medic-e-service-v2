//! Queue-manager ("หมอรันคิว") time logs and the 2-hour bonus.
//! Same rules as saveManagerHistory in src/pages/QueueSystem/hooks/useQueueMutations.ts.
use chrono::{DateTime, FixedOffset, TimeDelta, Utc};
use serde::Deserialize;
use serde_json::json;
use tracing::warn;
use crate::db::{eq, Db};
use crate::duty_logic::ts;
use crate::error::AppError;

const BONUS_MINUTES: i64 = 120;

#[derive(Deserialize)]
pub struct QueueRow {
    pub status: Option<String>,
    pub manager_start_time: Option<DateTime<Utc>>,
}

#[derive(Deserialize)]
struct DurationRow {
    duration_minutes: Option<i64>,
}

/// "Today" means today in Thailand, whatever time zone the server runs in.
fn bangkok_day_start(now: DateTime<Utc>) -> DateTime<Utc> {
    let bkk = FixedOffset::east_opt(7 * 3600).unwrap();
    now.with_timezone(&bkk)
        .date_naive()
        .and_hms_opt(0, 0, 0)
        .unwrap()
        .and_local_timezone(bkk)
        .unwrap()
        .with_timezone(&Utc)
}

pub async fn save_manager_history(db: &Db, discord_id: &str, start: DateTime<Utc>) -> Result<(), AppError> {
    let end = Utc::now();
    let minutes = (end - start).num_minutes();
    if minutes <= 0 {
        return Ok(());
    }

    db.insert(
        "queue_manager_logs",
        &json!({ "discord_id": discord_id, "start_time": ts(start), "end_time": ts(end), "duration_minutes": minutes }),
    )
    .await?;

    let today: Vec<DurationRow> = db
        .select(
            "queue_manager_logs",
            &[
                ("select", "duration_minutes".into()),
                ("discord_id", eq(discord_id)),
                ("start_time", format!("gte.{}", ts(bangkok_day_start(end)))),
            ],
        )
        .await?;
    let total: i64 = today.iter().filter_map(|r| r.duration_minutes).sum();

    // Grant +2h duty once, at the moment today's manager time crosses 2 hours.
    if total - minutes < BONUS_MINUTES && total >= BONUS_MINUTES {
        db.insert(
            "duty_logs",
            &json!({
                "discord_id": discord_id,
                "status": "completed",
                "clock_in": ts(end),
                "clock_out": ts(end + TimeDelta::minutes(BONUS_MINUTES)),
                "total_break_minutes": 0,
                "total_duty_minutes": BONUS_MINUTES,
                "duty_type": "queue_manager_bonus",
                "granted_by": "system"
            }),
        )
        .await?;
    }
    Ok(())
}

/// Removes a doctor from the queue. Saves manager time first, like cleanupUserQueueAndStory.
pub async fn clear_queue_for(db: &Db, discord_id: &str) -> Result<(), AppError> {
    let rows: Vec<QueueRow> = db
        .select(
            "queue_status",
            &[("select", "status,manager_start_time".into()), ("discord_id", eq(discord_id))],
        )
        .await?;
    if let Some(row) = rows.first() {
        if let (Some("manager"), Some(start)) = (row.status.as_deref(), row.manager_start_time) {
            // Losing a log is bad, but it must not block leaving the queue.
            if let Err(e) = save_manager_history(db, discord_id, start).await {
                warn!("could not save manager history for {discord_id}: {e:?}");
            }
        }
        let _ = db.delete("queue_status", &[("discord_id", eq(discord_id))]).await;
    }

    // Clear volunteer doctor status if present
    #[derive(Deserialize)]
    struct SettingRow {
        value: Option<String>,
    }

    let settings: Vec<SettingRow> = db
        .select("system_settings", &[("select", "value".into()), ("key", eq("queue_volunteers"))])
        .await
        .unwrap_or_default();

    if let Some(setting) = settings.first().and_then(|s| s.value.as_ref()) {
        if let Ok(mut volunteers) = serde_json::from_str::<Vec<serde_json::Value>>(setting) {
            let mut changed = false;
            for v in &mut volunteers {
                if v.get("id").and_then(|i| i.as_str()) == Some(discord_id) && !v["status"].is_null() {
                    v["status"] = serde_json::Value::Null;
                    changed = true;
                }
            }
            if changed {
                let updated = serde_json::to_string(&volunteers).unwrap_or_default();
                let _ = db.upsert(
                    "system_settings",
                    "key",
                    &json!({
                        "key": "queue_volunteers",
                        "value": updated,
                        "description": "ข้อมูลหมออาสา",
                        "type": "json"
                    }),
                ).await;
            }
        }
    }

    Ok(())
}
