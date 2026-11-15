use chrono::{DateTime, Utc};
use serde::Deserialize;
use serde_json::json;
use crate::db::{eq, Db};
use crate::duty_logic::{self, max_break, ts};
use crate::error::AppError;
use crate::services::manager;

const COLUMNS: &str = "id,discord_id,status,clock_in,last_break_start,total_break_minutes";

#[derive(Deserialize)]
pub struct Session {
    pub id: String,
    pub discord_id: String,
    pub status: String,
    pub clock_in: DateTime<Utc>,
    pub last_break_start: Option<DateTime<Utc>>,
    pub total_break_minutes: Option<f64>,
}

impl Session {
    /// When the current break hits the 15-minute limit (None if not on break).
    pub fn break_deadline(&self) -> Option<DateTime<Utc>> {
        if self.status != "on_break" {
            return None;
        }
        self.last_break_start.map(|b| b + max_break())
    }
}

pub struct Closed {
    pub deleted: bool,
    pub duty_minutes: i64,
}

pub async fn active_session(db: &Db, discord_id: &str) -> Result<Option<Session>, AppError> {
    let rows: Vec<Session> = db
        .select(
            "duty_logs",
            &[
                ("select", COLUMNS.into()),
                ("discord_id", eq(discord_id)),
                ("status", "in.(on_duty,on_break)".into()),
                ("order", "clock_in.desc".into()),
                ("limit", "1".into()),
            ],
        )
        .await?;
    Ok(rows.into_iter().next())
}

pub async fn expired_breaks(db: &Db) -> Result<Vec<Session>, AppError> {
    let cutoff = Utc::now() - max_break();
    db.select(
        "duty_logs",
        &[
            ("select", COLUMNS.into()),
            ("status", eq("on_break")),
            ("last_break_start", format!("lt.{}", ts(cutoff))),
        ],
    )
    .await
}

/// Ends a session as of `at` and clears the doctor's queue row.
/// The row is only touched if its status still matches `status_filter`,
/// so two closers (watchdog + doctor) cannot both win. Returns None if someone else already closed it.
pub async fn close_session(db: &Db, s: &Session, at: DateTime<Utc>, status_filter: &str) -> Result<Option<Closed>, AppError> {
    let break_since = if s.status == "on_break" { s.last_break_start } else { None };
    let (total_break, duty) = duty_logic::close(s.clock_in, s.total_break_minutes.unwrap_or(0.0), break_since, at);
    let filter = [("id", eq(&s.id)), ("status", status_filter.to_string())];

    let changed = if duty <= 0 {
        db.delete("duty_logs", &filter).await?
    } else {
        db.update(
            "duty_logs",
            &filter,
            &json!({ "status": "completed", "clock_out": ts(at), "total_break_minutes": total_break, "total_duty_minutes": duty }),
        )
        .await?
    };
    if changed == 0 {
        return Ok(None);
    }

    manager::clear_queue_for(db, &s.discord_id).await?;
    Ok(Some(Closed { deleted: duty <= 0, duty_minutes: duty }))
}
