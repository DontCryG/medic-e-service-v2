use std::sync::Arc;
use std::time::Duration;
use chrono::Utc;
use tracing::{error, info};
use crate::services::discord;
use crate::services::duty;
use crate::state::AppState;

/// Every 60s, clocks out anyone whose break passed 15 minutes,
/// even if their browser is closed. One server does this instead of every open tab.
pub fn start_break_watchdog(state: Arc<AppState>) {
    tokio::spawn(async move {
        info!("break watchdog started (every 60s)");
        let mut interval = tokio::time::interval(Duration::from_secs(60));
        loop {
            interval.tick().await;
            let sessions = match duty::expired_breaks(&state.db).await {
                Ok(s) => s,
                Err(e) => {
                    error!("break sweep failed: {e:?}");
                    continue;
                }
            };
            for s in sessions {
                let at = s.break_deadline().unwrap_or_else(Utc::now);
                match duty::close_session(&state.db, &s, at, "eq.on_break").await {
                    Ok(Some(_)) => {
                        info!("auto clock-out after 15 min break: {}", s.discord_id);
                        discord::notify_auto_clock_out(Arc::clone(&state), s.discord_id.clone());
                    }
                    Ok(None) => {}
                    Err(e) => error!("auto clock-out failed for {}: {e:?}", s.discord_id),
                }
            }
        }
    });
}
