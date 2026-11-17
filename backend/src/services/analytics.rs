use std::collections::{HashMap, HashSet};
use chrono::{DateTime, Datelike, Duration, Timelike, Utc};
use serde::{Deserialize, Serialize};

use crate::db::{self, Db};
use crate::duty_logic::parse_date_or_datetime;
use crate::error::AppError;
use crate::services::salary::{calculate_payroll, DutyLogRow, SalaryResult};

const THAI_DAYS: [&str; 7] = [
    "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์", "อาทิตย์",
];
const THAI_SHORT_DAYS: [&str; 7] = [
    "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส.", "อา.",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HeatmapCell {
    pub day_index: usize,
    pub day_name: String,
    pub hour: usize,
    pub hour_label: String,
    pub total_duty_minutes: i64,
    pub total_duty_hours: f64,
    pub avg_doctors: f64,
    pub density_level: u8,
    pub unique_doctor_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ShortageInsight {
    pub r#type: String,
    pub title: String,
    pub description: String,
    pub time_range: Option<String>,
    pub days: Option<String>,
    pub severity: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrendDataPoint {
    pub key: String,
    pub label: String,
    pub budget: i64,
    pub hours: f64,
    pub active_doctors: usize,
    pub formatted_date: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PositionBudgetBreakdown {
    pub position_name: String,
    pub rank: i32,
    pub total_budget: i64,
    pub total_hours: f64,
    pub doctor_count: usize,
    pub percent_of_total: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExecutiveKPIs {
    pub total_budget: i64,
    pub prev_total_budget: i64,
    pub budget_growth_percent: f64,
    pub total_duty_hours: f64,
    pub prev_total_duty_hours: f64,
    pub hours_growth_percent: f64,
    pub active_doctors_count: usize,
    pub total_doctors_count: usize,
    pub active_rate_percent: f64,
    pub cost_per_hour: i64,
    pub prev_cost_per_hour: i64,
    pub cost_per_hour_growth_percent: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsDateRange {
    pub start_date: String,
    pub end_date: String,
    pub days_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyticsSummary {
    pub kpis: ExecutiveKPIs,
    pub heatmap_matrix: Vec<Vec<HeatmapCell>>,
    pub trend_data: Vec<TrendDataPoint>,
    pub position_breakdown: Vec<PositionBudgetBreakdown>,
    pub insights: Vec<ShortageInsight>,
    pub date_range: AnalyticsDateRange,
}

pub async fn compute_analytics_summary(
    db: &Db,
    start_str: &str,
    end_str: &str,
) -> Result<AnalyticsSummary, AppError> {
    let start_dt = parse_date_or_datetime(start_str)
        .ok_or_else(|| AppError::BadRequest("รูปแบบ start_date ไม่ถูกต้อง".into()))?;
    let end_dt = parse_date_or_datetime(end_str)
        .ok_or_else(|| AppError::BadRequest("รูปแบบ end_date ไม่ถูกต้อง".into()))?;

    let duration = end_dt.signed_duration_since(start_dt);
    let days_count = duration.num_days().max(1);

    // Compute previous period
    let prev_end_dt = start_dt - Duration::milliseconds(1);
    let prev_start_dt = prev_end_dt - duration;
    let prev_start_str = prev_start_dt.to_rfc3339();
    let prev_end_str = prev_end_dt.to_rfc3339();

    // 1. Calculate Current & Previous Payrolls
    let current_payroll = calculate_payroll(db, start_str, end_str).await?;
    let prev_payroll = calculate_payroll(db, &prev_start_str, &prev_end_str).await.unwrap_or_else(|_| {
        crate::services::salary::SalarySummaryResponse {
            results: vec![],
            total_budget: 0,
            total_duty_hours: 0.0,
            total_oc_money: 0,
            active_doctors: 0,
            total_doctors: 0,
        }
    });

    // 2. Fetch Current Duty Logs
    let current_logs: Vec<DutyLogRow> = db
        .select_all(
            "duty_logs",
            &[
                ("select", "*".into()),
                ("clock_in", db::gte(start_str)),
                ("clock_in", db::lte(end_str)),
            ],
        )
        .await?;

    // 3. Compute 7x24 Heatmap Matrix
    let (heatmap_matrix, insights) = build_heatmap_and_insights(&current_logs, start_dt, end_dt);

    // 4. Compute Trend Data Points
    let trend_data = build_trend_points(&current_logs, &current_payroll.results, start_dt, end_dt, days_count);

    // 5. Compute Position Breakdown
    let position_breakdown = build_position_breakdown(&current_payroll.results, current_payroll.total_budget);

    // 6. Compute KPIs
    let kpis = build_executive_kpis(&current_payroll, &prev_payroll);

    Ok(AnalyticsSummary {
        kpis,
        heatmap_matrix,
        trend_data,
        position_breakdown,
        insights,
        date_range: AnalyticsDateRange {
            start_date: start_str.to_string(),
            end_date: end_str.to_string(),
            days_count,
        },
    })
}

fn build_heatmap_and_insights(
    logs: &[DutyLogRow],
    start_dt: DateTime<Utc>,
    end_dt: DateTime<Utc>,
) -> (Vec<Vec<HeatmapCell>>, Vec<ShortageInsight>) {
    let mut total_minutes_grid = vec![vec![0i64; 24]; 7];
    let mut unique_doctors_grid: Vec<Vec<HashSet<String>>> = (0..7)
        .map(|_| (0..24).map(|_| HashSet::new()).collect())
        .collect();

    // Count day occurrences
    let mut day_occurrences = [0i64; 7];
    let mut cursor = start_dt;
    while cursor <= end_dt {
        // Monday = 0, Sunday = 6
        let day_idx = (cursor.weekday().num_days_from_monday()) as usize;
        day_occurrences[day_idx] += 1;
        cursor += Duration::days(1);
    }
    for d in &mut day_occurrences {
        if *d == 0 {
            *d = 1;
        }
    }

    let range_start = start_dt.timestamp_millis();
    let range_end = end_dt.timestamp_millis();
    let now_millis = Utc::now().timestamp_millis();

    for log in logs {
        let start_ms = log.clock_in.timestamp_millis();
        let end_ms = log
            .clock_out
            .map(|t| t.timestamp_millis())
            .unwrap_or(now_millis);

        if end_ms < range_start || start_ms > range_end {
            continue;
        }

        let effective_start = start_ms.max(range_start);
        let effective_end = end_ms.min(range_end);
        if effective_end <= effective_start {
            continue;
        }

        let mut cur = effective_start;
        while cur < effective_end {
            let cur_dt = match DateTime::from_timestamp_millis(cur) {
                Some(dt) => dt,
                None => break,
            };
            let day_idx = cur_dt.weekday().num_days_from_monday() as usize;
            let hour = cur_dt.hour() as usize;

            // Next hour boundary
            let next_hour_dt = cur_dt
                .with_minute(0)
                .and_then(|d| d.with_second(0))
                .and_then(|d| d.with_nanosecond(0))
                .map(|d| d + Duration::hours(1));

            let next_hour_ms = next_hour_dt
                .map(|d| d.timestamp_millis())
                .unwrap_or(effective_end);

            let chunk_end = effective_end.min(next_hour_ms);
            let mins = ((chunk_end - cur) / 60000).max(0);

            total_minutes_grid[day_idx][hour] += mins;
            unique_doctors_grid[day_idx][hour].insert(log.discord_id.clone());

            cur = chunk_end;
        }
    }

    let mut matrix = Vec::with_capacity(7);
    let mut min_avg = f64::MAX;
    let mut max_avg = f64::MIN;
    let mut _min_slot = (0, 0);
    let mut max_slot = (0, 0);
    let mut hour_total_hours = [0.0f64; 24];
    let mut day_total_hours = [0.0f64; 7];

    for d in 0..7 {
        let mut row = Vec::with_capacity(24);
        let occ = day_occurrences[d];

        for h in 0..24 {
            let total_mins = total_minutes_grid[d][h];
            let total_hours = ((total_mins as f64 / 60.0) * 10.0).round() / 10.0;
            let avg_doctors = ((total_mins as f64 / (occ as f64 * 60.0)) * 10.0).round() / 10.0;

            day_total_hours[d] += total_hours;
            hour_total_hours[h] += total_hours;

            if avg_doctors < min_avg {
                min_avg = avg_doctors;
                _min_slot = (d, h);
            }
            if avg_doctors > max_avg {
                max_avg = avg_doctors;
                max_slot = (d, h);
            }

            let density_level = if avg_doctors == 0.0 {
                0
            } else if avg_doctors < 1.5 {
                1
            } else if avg_doctors < 3.5 {
                2
            } else if avg_doctors < 5.5 {
                3
            } else {
                4
            };

            row.push(HeatmapCell {
                day_index: d,
                day_name: THAI_DAYS[d].to_string(),
                hour: h,
                hour_label: format!("{:02}:00", h),
                total_duty_minutes: total_mins,
                total_duty_hours: total_hours,
                avg_doctors,
                density_level,
                unique_doctor_count: unique_doctors_grid[d][h].len(),
            });
        }
        matrix.push(row);
    }

    let mut insights = Vec::new();

    // Critical shortage analysis
    let total_occ_sum: i64 = day_occurrences.iter().sum();
    let mut low_hours = Vec::new();
    for (h, &total_h) in hour_total_hours.iter().enumerate() {
        let avg = total_h / (total_occ_sum.max(1) as f64);
        if avg < 1.0 {
            low_hours.push(h);
        }
    }

    if !low_hours.is_empty() {
        let start_h = low_hours[0];
        let end_h = (low_hours[low_hours.len() - 1] + 1) % 24;
        insights.push(ShortageInsight {
            r#type: "critical_shortage".into(),
            title: "วิกฤตขาดแคลนแพทย์ (Critical Shortage Window)".into(),
            description: format!(
                "ช่วงเวลา {:02}:00 - {:02}:00 น. มีแพทย์ประจำการเฉลี่ยเพียง {:.1} คน เสี่ยงต่อการไม่มีแพทย์รับเคสฉุกเฉินในเมือง",
                start_h, end_h, min_avg
            ),
            time_range: Some(format!("{:02}:00 - {:02}:00 น.", start_h, end_h)),
            days: None,
            severity: "danger".into(),
        });
    } else {
        insights.push(ShortageInsight {
            r#type: "critical_shortage".into(),
            title: "ความต่อเนื่องของเวร (Coverage Stability)".into(),
            description: "ทุกช่วงเวลามีแพทย์ปฏิบัติการขั้นต่ำอย่างน้อย 1 คนขึ้นไป ไม่มีช่วงวิกฤตขาดแคลนรุนแรง".into(),
            time_range: None,
            days: None,
            severity: "success".into(),
        });
    }

    // Peak hours analysis
    let mut peak_start_h = 19;
    let mut peak_end_h = 23;
    let mut highest_3h = -1.0;
    for h in 0..22 {
        let sum = hour_total_hours[h] + hour_total_hours[h + 1] + hour_total_hours[h + 2];
        if sum > highest_3h {
            highest_3h = sum;
            peak_start_h = h;
            peak_end_h = (h + 3) % 24;
        }
    }

    insights.push(ShortageInsight {
        r#type: "peak_hours".into(),
        title: "ช่วงเวลาที่แพทย์หนาแน่นสูงสุด (Peak Duty Window)".into(),
        description: format!(
            "ช่วงเวลา {:02}:00 - {:02}:00 น. มีอัตราการเข้าเวรพร้อมกันสูงสุดเฉลี่ย {:.1} คน (หนาแน่นสุด: วัน{})",
            peak_start_h, peak_end_h, max_avg, THAI_DAYS[max_slot.0]
        ),
        time_range: Some(format!("{:02}:00 - {:02}:00 น.", peak_start_h, peak_end_h)),
        days: None,
        severity: "info".into(),
    });

    // Staffing recommendation
    let quietest_d = day_total_hours
        .iter()
        .enumerate()
        .min_by(|a, b| a.1.partial_cmp(b.1).unwrap_or(std::cmp::Ordering::Equal))
        .map(|(idx, _)| idx)
        .unwrap_or(0);

    insights.push(ShortageInsight {
        r#type: "recommendation".into(),
        title: "คำแนะนำการบริหารกำลังพล (Executive Recommendation)".into(),
        description: format!(
            "ควรพิจารณาจัดระบบโบนัสเวรดึก (Night Shift Multiplier) หรือเวรพิเศษช่วงวัน{} เพื่อกระจายกำลังพลให้ครอบคลุมตลอด 24 ชม.",
            THAI_DAYS[quietest_d]
        ),
        time_range: None,
        days: Some(format!("วัน{}", THAI_DAYS[quietest_d])),
        severity: "warning".into(),
    });

    (matrix, insights)
}

fn build_trend_points(
    logs: &[DutyLogRow],
    salary_results: &[SalaryResult],
    start_dt: DateTime<Utc>,
    end_dt: DateTime<Utc>,
    days_count: i64,
) -> Vec<TrendDataPoint> {
    let mut rate_map: HashMap<String, f64> = HashMap::new();
    for sr in salary_results {
        if sr.total_hours > 0.0 {
            rate_map.insert(sr.discord_id.clone(), sr.ic_salary as f64 / sr.total_hours);
        }
    }

    let mut points = Vec::new();

    if days_count <= 14 {
        let mut cursor = start_dt;
        while cursor <= end_dt {
            let day_start = cursor
                .with_hour(0)
                .and_then(|d| d.with_minute(0))
                .and_then(|d| d.with_second(0))
                .unwrap_or(cursor);
            let day_end = day_start + Duration::days(1) - Duration::milliseconds(1);

            let day_start_ms = day_start.timestamp_millis();
            let day_end_ms = day_end.timestamp_millis();
            let day_idx = (cursor.weekday().num_days_from_monday()) as usize;
            let label = format!("{} {}", THAI_SHORT_DAYS[day_idx], cursor.day());

            let mut total_mins: i64 = 0;
            let mut total_budget: f64 = 0.0;
            let mut active_docs = HashSet::new();

            for log in logs {
                let start_ms = log.clock_in.timestamp_millis();
                let end_ms = log.clock_out.map(|t| t.timestamp_millis()).unwrap_or(Utc::now().timestamp_millis());

                if end_ms < day_start_ms || start_ms > day_end_ms {
                    continue;
                }

                let eff_start = start_ms.max(day_start_ms);
                let eff_end = end_ms.min(day_end_ms);
                let mins = ((eff_end - eff_start) / 60000).max(0);

                total_mins += mins;
                active_docs.insert(log.discord_id.clone());

                let rate = rate_map.get(&log.discord_id).copied().unwrap_or(50_000.0);
                total_budget += (mins as f64 / 60.0) * rate;
            }

            points.push(TrendDataPoint {
                key: cursor.format("%Y-%m-%d").to_string(),
                label,
                budget: total_budget.round() as i64,
                hours: ((total_mins as f64 / 60.0) * 10.0).round() / 10.0,
                active_doctors: active_docs.len(),
                formatted_date: Some(cursor.format("%d/%m").to_string()),
            });

            cursor += Duration::days(1);
        }
    } else {
        let mut week_idx = 1;
        let mut cursor = start_dt;

        while cursor <= end_dt {
            let week_start = cursor;
            let mut week_end = week_start + Duration::days(6);
            if week_end > end_dt {
                week_end = end_dt;
            }

            let week_start_ms = week_start.timestamp_millis();
            let week_end_ms = week_end.timestamp_millis();
            let label = format!("สัปดาห์ที่ {} ({}/{})", week_idx, week_start.day(), week_start.month());

            let mut total_mins: i64 = 0;
            let mut total_budget: f64 = 0.0;
            let mut active_docs = HashSet::new();

            for log in logs {
                let start_ms = log.clock_in.timestamp_millis();
                let end_ms = log.clock_out.map(|t| t.timestamp_millis()).unwrap_or(Utc::now().timestamp_millis());

                if end_ms < week_start_ms || start_ms > week_end_ms {
                    continue;
                }

                let eff_start = start_ms.max(week_start_ms);
                let eff_end = end_ms.min(week_end_ms);
                let mins = ((eff_end - eff_start) / 60000).max(0);

                total_mins += mins;
                active_docs.insert(log.discord_id.clone());

                let rate = rate_map.get(&log.discord_id).copied().unwrap_or(50_000.0);
                total_budget += (mins as f64 / 60.0) * rate;
            }

            points.push(TrendDataPoint {
                key: format!("week_{}", week_idx),
                label,
                budget: total_budget.round() as i64,
                hours: ((total_mins as f64 / 60.0) * 10.0).round() / 10.0,
                active_doctors: active_docs.len(),
                formatted_date: None,
            });

            cursor += Duration::days(7);
            week_idx += 1;
        }
    }

    points
}

fn build_position_breakdown(
    results: &[SalaryResult],
    total_all_budget: i64,
) -> Vec<PositionBudgetBreakdown> {
    struct PosAgg {
        rank: i32,
        budget: i64,
        hours: f64,
        doctors: HashSet<String>,
    }

    let mut map: HashMap<String, PosAgg> = HashMap::new();

    for sr in results {
        let entry = map.entry(sr.position_name.clone()).or_insert_with(|| PosAgg {
            rank: sr.rank,
            budget: 0,
            hours: 0.0,
            doctors: HashSet::new(),
        });
        entry.budget += sr.ic_salary;
        entry.hours += sr.total_hours;
        if sr.total_hours > 0.0 {
            entry.doctors.insert(sr.discord_id.clone());
        }
    }

    let mut list = Vec::new();
    for (name, agg) in map {
        if agg.budget > 0 || agg.hours > 0.0 {
            let pct = if total_all_budget > 0 {
                ((agg.budget as f64 / total_all_budget as f64) * 1000.0).round() / 10.0
            } else {
                0.0
            };

            list.push(PositionBudgetBreakdown {
                position_name: name,
                rank: agg.rank,
                total_budget: agg.budget,
                total_hours: (agg.hours * 10.0).round() / 10.0,
                doctor_count: agg.doctors.len(),
                percent_of_total: pct,
            });
        }
    }

    list.sort_by(|a, b| a.rank.cmp(&b.rank).then_with(|| b.total_budget.cmp(&a.total_budget)));
    list
}

fn build_executive_kpis(
    current: &crate::services::salary::SalarySummaryResponse,
    prev: &crate::services::salary::SalarySummaryResponse,
) -> ExecutiveKPIs {
    let total_budget = current.total_budget;
    let prev_total_budget = prev.total_budget;
    let budget_growth_percent = if prev_total_budget > 0 {
        (((total_budget - prev_total_budget) as f64 / prev_total_budget as f64) * 1000.0).round() / 10.0
    } else if total_budget > 0 {
        100.0
    } else {
        0.0
    };

    let total_duty_hours = (current.total_duty_hours * 10.0).round() / 10.0;
    let prev_total_duty_hours = (prev.total_duty_hours * 10.0).round() / 10.0;
    let hours_growth_percent = if prev_total_duty_hours > 0.0 {
        (((total_duty_hours - prev_total_duty_hours) / prev_total_duty_hours) * 1000.0).round() / 10.0
    } else if total_duty_hours > 0.0 {
        100.0
    } else {
        0.0
    };

    let active_doctors_count = current.active_doctors;
    let total_doctors_count = current.total_doctors;
    let active_rate_percent = if total_doctors_count > 0 {
        ((active_doctors_count as f64 / total_doctors_count as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    let cost_per_hour = if total_duty_hours > 0.0 {
        (total_budget as f64 / total_duty_hours).round() as i64
    } else {
        0
    };

    let prev_cost_per_hour = if prev_total_duty_hours > 0.0 {
        (prev_total_budget as f64 / prev_total_duty_hours).round() as i64
    } else {
        0
    };

    let cost_per_hour_growth_percent = if prev_cost_per_hour > 0 {
        (((cost_per_hour - prev_cost_per_hour) as f64 / prev_cost_per_hour as f64) * 1000.0).round() / 10.0
    } else {
        0.0
    };

    ExecutiveKPIs {
        total_budget,
        prev_total_budget,
        budget_growth_percent,
        total_duty_hours,
        prev_total_duty_hours,
        hours_growth_percent,
        active_doctors_count,
        total_doctors_count,
        active_rate_percent,
        cost_per_hour,
        prev_cost_per_hour,
        cost_per_hour_growth_percent,
    }
}
