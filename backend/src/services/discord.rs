use std::sync::Arc;
use chrono::Utc;
use serde::Deserialize;
use serde_json::json;
use tracing::warn;

use crate::db::eq;
use crate::state::AppState;

#[derive(Deserialize)]
struct UserRow {
    ic_name: Option<String>,
}

async fn get_doctor_label(st: &AppState, discord_id: &str) -> String {
    let rows: Vec<UserRow> = st
        .db
        .select("users", &[("select", "ic_name".into()), ("discord_id", eq(discord_id))])
        .await
        .unwrap_or_default();

    match rows.first().and_then(|r| r.ic_name.as_deref()) {
        Some(name) if !name.is_empty() => format!("{name} (<@{discord_id}>)"),
        _ => format!("<@{discord_id}>"),
    }
}

pub fn notify_clock_in(st: Arc<AppState>, discord_id: String) {
    let webhook = match st.discord_webhook_url.clone() {
        Some(w) if !w.trim().is_empty() => w,
        _ => return,
    };

    tokio::spawn(async move {
        let label = get_doctor_label(&st, &discord_id).await;
        let payload = json!({
            "username": "Medic Hospital System",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
            "embeds": [{
                "title": "🩺 แพทย์เข้าเวร (Clock In)",
                "description": format!("**แพทย์:** {label}\n**สถานะ:** เข้าเวรเรียบร้อยแล้ว"),
                "color": 3066993, // Green
                "timestamp": Utc::now().to_rfc3339()
            }]
        });

        if let Err(e) = st.http.post(&webhook).json(&payload).send().await {
            warn!("Failed to send Discord clock-in notification: {e:?}");
        }
    });
}

pub fn notify_break(st: Arc<AppState>, discord_id: String, on_break: bool) {
    let webhook = match st.discord_webhook_url.clone() {
        Some(w) if !w.trim().is_empty() => w,
        _ => return,
    };

    tokio::spawn(async move {
        let label = get_doctor_label(&st, &discord_id).await;
        let (title, desc, color) = if on_break {
            ("☕ เริ่มพักเบรก (Break Started)", format!("**แพทย์:** {label}\n**สถานะ:** เริ่มพักเบรก (จำกัดเวลาสูงสุด 15 นาที)"), 16766720)
        } else {
            ("🩺 กลับเข้าเวร (Break Resumed)", format!("**แพทย์:** {label}\n**สถานะ:** สิ้นสุดการพักเบรก กลับเข้าปฏิบัติงาน"), 3066993)
        };

        let payload = json!({
            "username": "Medic Hospital System",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
            "embeds": [{
                "title": title,
                "description": desc,
                "color": color,
                "timestamp": Utc::now().to_rfc3339()
            }]
        });

        if let Err(e) = st.http.post(&webhook).json(&payload).send().await {
            warn!("Failed to send Discord break notification: {e:?}");
        }
    });
}

pub fn notify_clock_out(st: Arc<AppState>, discord_id: String, duty_minutes: i64, deleted: bool) {
    let webhook = match st.discord_webhook_url.clone() {
        Some(w) if !w.trim().is_empty() => w,
        _ => return,
    };

    tokio::spawn(async move {
        let label = get_doctor_label(&st, &discord_id).await;
        let (title, desc, color) = if deleted {
            ("⚠️ ยกเลิกการเข้าเวร", format!("**แพทย์:** {label}\n**รายละเอียด:** ยกเลิกการเข้าเวรเนื่องจากเวลาปฏิบัติงานไม่ถึง 1 นาที"), 15105570)
        } else {
            let hours = duty_minutes / 60;
            let mins = duty_minutes % 60;
            let time_str = if hours > 0 { format!("{hours} ชั่วโมง {mins} นาที") } else { format!("{mins} นาที") };
            ("🚪 แพทย์ออกเวร (Clock Out)", format!("**แพทย์:** {label}\n**เวลาปฏิบัติงานสุทธิ:** {time_str} ({duty_minutes} นาที)"), 8266446)
        };

        let payload = json!({
            "username": "Medic Hospital System",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
            "embeds": [{
                "title": title,
                "description": desc,
                "color": color,
                "timestamp": Utc::now().to_rfc3339()
            }]
        });

        if let Err(e) = st.http.post(&webhook).json(&payload).send().await {
            warn!("Failed to send Discord clock-out notification: {e:?}");
        }
    });
}

pub fn notify_auto_clock_out(st: Arc<AppState>, discord_id: String) {
    let webhook = match st.discord_webhook_url.clone() {
        Some(w) if !w.trim().is_empty() => w,
        _ => return,
    };

    tokio::spawn(async move {
        let label = get_doctor_label(&st, &discord_id).await;
        let payload = json!({
            "username": "Medic Hospital System",
            "avatar_url": "https://cdn-icons-png.flaticon.com/512/3063/3063176.png",
            "embeds": [{
                "title": "🚨 ระบบตัดเวรอัตโนมัติ (Auto Clock Out)",
                "description": format!("**แพทย์:** {label}\n**สาเหตุ:** พักเบรกเกินกำหนด 15 นาที\nระบบได้ทำการออกเวรและเคลียร์สถานะคิวให้อัตโนมัติแล้ว"),
                "color": 15158332, // Red
                "timestamp": Utc::now().to_rfc3339()
            }]
        });

        if let Err(e) = st.http.post(&webhook).json(&payload).send().await {
            warn!("Failed to send Discord auto-clock-out notification: {e:?}");
        }
    });
}
