use std::collections::{HashMap, HashSet};
use chrono::{DateTime, Datelike, Utc};
use serde::{Deserialize, Serialize};

use crate::db::{self, Db};
use crate::error::AppError;

#[derive(Debug, Clone, Deserialize)]
pub struct PositionInfo {
    pub name: Option<String>,
    pub rank: Option<i32>,
    pub ic_rate: Option<i64>,
    pub oc_rate: Option<i64>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct UserRow {
    pub discord_id: String,
    pub ic_name: Option<String>,
    pub role: Option<String>,
    pub positions: Option<PositionInfo>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct DutyLogRow {
    pub id: String,
    pub discord_id: String,
    pub clock_in: DateTime<Utc>,
    pub clock_out: Option<DateTime<Utc>>,
    pub total_duty_minutes: Option<i64>,
    pub duty_type: Option<String>,
    pub status: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct LeaveRow {
    pub id: String,
    pub discord_id: String,
    pub start_date: DateTime<Utc>,
    pub end_date: DateTime<Utc>,
    pub status: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct QueueManagerRow {
    pub id: String,
    pub discord_id: String,
    pub start_time: DateTime<Utc>,
    pub duration_minutes: Option<i64>,
}

#[allow(dead_code)]
#[derive(Debug, Clone, Deserialize)]
pub struct SettingRow {
    pub key: String,
    pub value: Option<String>,
    pub r#type: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalaryResult {
    pub discord_id: String,
    pub ic_name: String,
    pub position_name: String,
    pub rank: i32,
    pub total_hours: f64,
    pub total_minutes: i64,
    pub ic_salary: i64,
    pub oc_points: i64,
    pub oc_money: i64,
    pub gacha_ic: i64,
    pub agency_gacha: i64,
    pub gacha_promote: i64,
    pub gacha_premium: i64,
    pub coins: i64,
    pub story_count: i64,
    pub story_money: i64,
    pub mentor_money: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SalarySummaryResponse {
    pub results: Vec<SalaryResult>,
    pub total_budget: i64,
    pub total_duty_hours: f64,
    pub total_oc_money: i64,
    pub active_doctors: usize,
    pub total_doctors: usize,
}

/// Fallback rates based on rank
fn fallback_rates_for_rank(rank: i32) -> (i64, i64) {
    match rank {
        1 => (70_000, 25), // ผู้อำนวยการ
        2 => (70_000, 25), // รองผู้อำนวยการ
        3 => (60_000, 15), // แพทย์ชำนาญการ
        4 => (55_000, 10), // แพทย์ทั่วไป
        5 => (55_000, 10), // พยาบาล
        6 => (50_000, 0),  // นักศึกษาแพทย์
        _ => (50_000, 0),
    }
}

pub async fn calculate_payroll(
    db: &Db,
    start_date: &str,
    end_date: &str,
) -> Result<SalarySummaryResponse, AppError> {
    // 1. Fetch Users with Positions
    let users: Vec<UserRow> = db
        .select_all(
            "users",
            &[
                ("select", "discord_id,ic_name,role,positions(name,rank,oc_rate,ic_rate)".into()),
                ("role", db::not_in("user,resigned")),
            ],
        )
        .await?;

    // 2. Fetch System Settings
    let settings_rows: Vec<SettingRow> = db.select("system_settings", &[]).await.unwrap_or_default();
    let mut settings: HashMap<String, f64> = HashMap::new();
    for s in settings_rows {
        if let Some(val_str) = s.value {
            if let Ok(num) = val_str.parse::<f64>() {
                settings.insert(s.key, num);
            }
        }
    }

    // 3. Fetch Duty Logs
    let duty_logs: Vec<DutyLogRow> = db
        .select_all(
            "duty_logs",
            &[
                ("select", "*".into()),
                ("clock_in", db::gte(start_date)),
                ("clock_in", db::lte(end_date)),
            ],
        )
        .await?;

    // 4. Fetch Leave Requests
    let leave_logs: Vec<LeaveRow> = db
        .select_all(
            "leave_requests",
            &[
                ("select", "*".into()),
                ("start_date", db::gte(start_date)),
                ("start_date", db::lte(end_date)),
            ],
        )
        .await?;

    // 5. Fetch Queue Manager Logs
    let qm_logs: Vec<QueueManagerRow> = db
        .select_all(
            "queue_manager_logs",
            &[
                ("select", "*".into()),
                ("start_time", db::gte(start_date)),
                ("start_time", db::lte(end_date)),
            ],
        )
        .await?;

    // Group duty logs by discord_id
    let mut user_duty_logs: HashMap<String, Vec<&DutyLogRow>> = HashMap::new();
    for log in &duty_logs {
        user_duty_logs.entry(log.discord_id.clone()).or_default().push(log);
    }

    // Group leave requests by discord_id
    let mut user_leaves: HashMap<String, Vec<&LeaveRow>> = HashMap::new();
    for l in &leave_logs {
        user_leaves.entry(l.discord_id.clone()).or_default().push(l);
    }

    // Group queue manager logs by discord_id
    let mut user_qm_logs: HashMap<String, Vec<&QueueManagerRow>> = HashMap::new();
    for qm in &qm_logs {
        user_qm_logs.entry(qm.discord_id.clone()).or_default().push(qm);
    }

    let bonus_7day_hours = settings.get("bonus_7day_hours").copied().unwrap_or(3.0) as i64;
    let qm_min_mins = settings.get("queue_bonus_min_minutes").copied().unwrap_or(120.0) as i64;
    let qm_bonus_hours = settings.get("queue_bonus_hours").copied().unwrap_or(2.0) as i64;
    let mentor_rate = settings.get("mentor_reward_amount").copied().unwrap_or(500_000.0) as i64;

    let mut pooled_gacha_ic: i64 = 0;
    let mut pooled_coins: i64 = 0;
    let mut active_users_count: usize = 0;

    let mut results: Vec<SalaryResult> = Vec::with_capacity(users.len());

    for user in &users {
        let logs = user_duty_logs.get(&user.discord_id).cloned().unwrap_or_default();

        let mut total_minutes: i64 = logs.iter().map(|l| l.total_duty_minutes.unwrap_or(0)).sum();

        // 7-day bonus check: worked on >= 7 distinct calendar days and no approved leaves in period
        let mut days_worked = HashSet::new();
        for l in &logs {
            let d = l.clock_in;
            days_worked.insert(format!("{}-{}-{}", d.year(), d.month(), d.day()));
        }

        let has_approved_leave = user_leaves
            .get(&user.discord_id)
            .map(|leaves| leaves.iter().any(|l| l.status.as_deref() == Some("approved")))
            .unwrap_or(false);

        if days_worked.len() >= 7 && !has_approved_leave {
            total_minutes += bonus_7day_hours * 60;
        }

        // Queue Manager bonus: if >= 120 mins in a calendar day -> +2h
        if let Some(user_qm) = user_qm_logs.get(&user.discord_id) {
            let mut qm_daily_mins: HashMap<String, i64> = HashMap::new();
            for qm in user_qm {
                let d = qm.start_time;
                let day_key = format!("{}-{}-{}", d.year(), d.month(), d.day());
                *qm_daily_mins.entry(day_key).or_insert(0) += qm.duration_minutes.unwrap_or(0);
            }
            for mins in qm_daily_mins.values() {
                if *mins >= qm_min_mins {
                    total_minutes += qm_bonus_hours * 60;
                }
            }
        }

        let total_hours = (total_minutes / 60) as f64;
        let total_hours_int = total_minutes / 60;

        let rank = user.positions.as_ref().and_then(|p| p.rank).unwrap_or(99);
        let (default_ic, default_oc) = fallback_rates_for_rank(rank);

        let ic_rate = user
            .positions
            .as_ref()
            .and_then(|p| p.ic_rate)
            .filter(|&r| r > 0)
            .unwrap_or(default_ic);

        let oc_rate = user
            .positions
            .as_ref()
            .and_then(|p| p.oc_rate)
            .unwrap_or(default_oc);

        let ic_salary = ic_rate * total_hours_int;
        let oc_points = (total_hours_int - 27).max(0);
        let oc_money = oc_points * oc_rate;

        let mut mentor_money: i64 = 0;
        for l in &logs {
            if l.duty_type.as_deref() == Some("mentor") {
                mentor_money += mentor_rate;
            }
        }

        let mut gacha_ic: i64 = 0;
        let mut agency_gacha: i64 = 0;
        let mut gacha_promote: i64 = 0;
        let mut gacha_premium: i64 = 0;
        let mut coins: i64 = 0;

        if total_hours_int >= 20 {
            gacha_ic = settings.get("reward_20h_gacha_ic").copied().unwrap_or(20.0) as i64;
            coins = settings.get("reward_20h_coins").copied().unwrap_or(20.0) as i64;
            gacha_premium = settings.get("reward_20h_gacha_premium").copied().unwrap_or(3.0) as i64;
            agency_gacha = settings.get("reward_20h_agency_gacha").copied().unwrap_or(50.0) as i64;
        } else if total_hours_int > 0 {
            gacha_ic = settings.get("reward_1h_gacha_ic").copied().unwrap_or(10.0) as i64;
            coins = settings.get("reward_1h_coins").copied().unwrap_or(5.0) as i64;
            let agency_base = settings.get("reward_agency_base_hours").copied().unwrap_or(10.0) as i64;
            let agency_mult = settings.get("reward_agency_multiplier").copied().unwrap_or(5.0) as i64;
            if total_hours_int > agency_base {
                agency_gacha = (total_hours_int - agency_base) * agency_mult;
            }
        } else {
            // Absent
            pooled_gacha_ic += 10;
            pooled_coins += 5;
        }

        // Gacha Promote (21-30 hours)
        if total_hours_int >= 21 {
            let promote_table: [(i64, i64); 10] = [
                (21, 30), (22, 40), (23, 50), (24, 60), (25, 70),
                (26, 80), (27, 100), (28, 120), (29, 150), (30, 180),
            ];
            for &(h, reward) in &promote_table {
                if total_hours_int >= h {
                    gacha_promote += reward;
                }
            }
        }

        if total_hours_int > 0 {
            active_users_count += 1;
        }

        results.push(SalaryResult {
            discord_id: user.discord_id.clone(),
            ic_name: user.ic_name.clone().unwrap_or_else(|| "Unknown".to_string()),
            position_name: user
                .positions
                .as_ref()
                .and_then(|p| p.name.clone())
                .unwrap_or_else(|| "แพทย์ทั่วไป".to_string()),
            rank,
            total_hours,
            total_minutes,
            ic_salary,
            oc_points,
            oc_money,
            gacha_ic,
            agency_gacha,
            gacha_promote,
            gacha_premium,
            coins,
            story_count: 0,
            story_money: 0,
            mentor_money,
        });
    }

    // Distribute pooled items among active doctors
    if active_users_count > 0 {
        let pool_ic_per_user = pooled_gacha_ic / active_users_count as i64;
        let pool_coins_per_user = pooled_coins / active_users_count as i64;
        for res in &mut results {
            if res.total_hours > 0.0 {
                res.gacha_ic += pool_ic_per_user;
                res.coins += pool_coins_per_user;
            }
        }
    }

    // Sort by Rank ascending, then by total_hours descending
    results.sort_by(|a, b| {
        a.rank
            .cmp(&b.rank)
            .then_with(|| b.total_hours.partial_cmp(&a.total_hours).unwrap_or(std::cmp::Ordering::Equal))
    });

    let total_budget: i64 = results.iter().map(|r| r.ic_salary).sum();
    let total_duty_hours: f64 = results.iter().map(|r| r.total_hours).sum();
    let total_oc_money: i64 = results.iter().map(|r| r.oc_money).sum();
    let total_doctors = results.len();

    Ok(SalarySummaryResponse {
        results,
        total_budget,
        total_duty_hours,
        total_oc_money,
        active_doctors: active_users_count,
        total_doctors,
    })
}
