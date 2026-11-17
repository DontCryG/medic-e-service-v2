//! Pure duty-time math. No I/O, so it is easy to test.
use chrono::{DateTime, SecondsFormat, TimeDelta, Utc};

pub const MAX_BREAK_MINUTES: i64 = 15;

pub fn max_break() -> TimeDelta {
    TimeDelta::minutes(MAX_BREAK_MINUTES)
}

/// Timestamp format Supabase accepts in URLs ("Z" instead of "+00:00").
pub fn ts(t: DateTime<Utc>) -> String {
    t.to_rfc3339_opts(SecondsFormat::Millis, true)
}

/// Parses either a full ISO timestamp ("2026-11-17T00:00:00Z") or date-only string ("2026-11-17").
pub fn parse_date_or_datetime(s: &str) -> Option<DateTime<Utc>> {
    let s = s.trim();
    if let Ok(dt) = s.parse::<DateTime<Utc>>() {
        return Some(dt);
    }
    if let Ok(d) = chrono::NaiveDate::parse_from_str(s, "%Y-%m-%d") {
        return d.and_hms_opt(0, 0, 0).map(|ndt| DateTime::<Utc>::from_naive_utc_and_offset(ndt, Utc));
    }
    None
}

pub fn round4(x: f64) -> f64 {
    (x * 10000.0).round() / 10000.0
}

/// Exact minutes between two times (fractional, never negative).
pub fn minutes(from: DateTime<Utc>, to: DateTime<Utc>) -> f64 {
    (to - from).num_milliseconds().max(0) as f64 / 60000.0
}

/// Final numbers when a session ends at `at`.
/// `break_since` is set when the doctor is on break right now; that break counts at most 15 minutes.
/// Returns (total_break_minutes, total_duty_minutes).
pub fn close(clock_in: DateTime<Utc>, prev_break: f64, break_since: Option<DateTime<Utc>>, at: DateTime<Utc>) -> (f64, i64) {
    let current = break_since.map_or(0.0, |b| minutes(b, at).min(MAX_BREAK_MINUTES as f64));
    let total_break = round4(prev_break + current);
    let duty = (minutes(clock_in, at) - total_break).floor().max(0.0) as i64;
    (total_break, duty)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    fn t(min: i64) -> DateTime<Utc> {
        Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap() + TimeDelta::minutes(min)
    }

    #[test]
    fn break_counts_at_most_15_minutes() {
        // In at 0, break from 60, closed at 100: break 15, duty 100 - 15 = 85.
        assert_eq!(close(t(0), 0.0, Some(t(60)), t(100)), (15.0, 85));
    }

    #[test]
    fn earlier_breaks_are_subtracted() {
        // 70 minutes on the clock, 10.5 already on break: 59.5 -> 59 full minutes.
        assert_eq!(close(t(0), 10.5, None, t(70)), (10.5, 59));
    }

    #[test]
    fn short_session_has_zero_duty() {
        assert_eq!(close(t(0), 0.0, None, t(0) + TimeDelta::seconds(40)).1, 0);
    }

    #[test]
    fn resume_adds_exact_break_time() {
        assert_eq!(round4(2.0 + minutes(t(0), t(3))), 5.0);
    }
}
