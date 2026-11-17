use chrono::Utc;
use serde::Deserialize;
use serde_json::{json, Value};
use tracing::{info, warn};

use crate::db;
use crate::state::AppState;

#[allow(dead_code)]
#[derive(Deserialize)]
struct ActiveDutyRow {
    discord_id: String,
    clock_in: String,
    duty_type: Option<String>,
}

#[derive(Deserialize)]
struct UserMetaRow {
    discord_id: String,
    ic_name: Option<String>,
}

#[derive(Deserialize)]
struct QueueStatusRow {
    discord_id: String,
    status: Option<String>,
}

/// Registers slash commands to Discord Global Application API if bot token and app id are set
pub async fn register_slash_commands_if_configured(st: &AppState) {
    let (token, app_id) = match (&st.discord_bot_token, &st.discord_application_id) {
        (Some(t), Some(id)) if !t.trim().is_empty() && !id.trim().is_empty() => (t, id),
        _ => {
            info!("ℹ️ [Discord Bot] DISCORD_BOT_TOKEN or DISCORD_APPLICATION_ID not configured; interactive slash commands will run in standby mode.");
            return;
        }
    };

    let url = format!("https://discord.com/api/v10/applications/{app_id}/commands");

    let commands = json!([
        {
            "name": "duty",
            "description": "🩺 ตรวจสอบรายชื่อแพทย์ที่กำลังปฏิบัติหน้าที่ในเมืองแบบเรียลไทม์"
        },
        {
            "name": "queue",
            "description": "📋 ตรวจสอบลำดับคิวและผู้จัดการคิวแพทย์ปัจจุบัน"
        },
        {
            "name": "call-medic",
            "description": "🚨 ส่งสัญญาณฉุกเฉินเรียกรวมพลแพทย์เข้าเมือง (Staff Emergency Alert)"
        }
    ]);

    match st
        .http
        .put(&url)
        .header("Authorization", format!("Bot {token}"))
        .json(&commands)
        .send()
        .await
    {
        Ok(res) if res.status().is_success() => {
            info!("✅ [Discord Bot] Successfully registered global slash commands (/duty, /queue, /call-medic) on Discord");
        }
        Ok(res) => {
            let status = res.status();
            let body = res.text().await.unwrap_or_default();
            warn!("⚠️ [Discord Bot] Failed to register slash commands ({status}): {body}");
        }
        Err(e) => {
            warn!("⚠️ [Discord Bot] Failed to connect to Discord API to register commands: {e:?}");
        }
    }
}

/// Handles Discord HTTP Interactions (Type 1 = PING, Type 2 = APPLICATION_COMMAND)
pub async fn handle_interaction(st: &AppState, payload: &Value) -> Value {
    let interaction_type = payload.get("type").and_then(|t| t.as_i64()).unwrap_or(0);

    // Type 1: Discord Ping verification
    if interaction_type == 1 {
        return json!({ "type": 1 });
    }

    // Type 2: Application Command (Slash Commands)
    if interaction_type == 2 {
        let command_name = payload
            .get("data")
            .and_then(|d| d.get("name"))
            .and_then(|n| n.as_str())
            .unwrap_or("");

        let sender_id = payload
            .get("member")
            .and_then(|m| m.get("user"))
            .and_then(|u| u.get("id"))
            .and_then(|id| id.as_str())
            .unwrap_or("unknown");

        match command_name {
            "duty" => handle_duty_command(st).await,
            "queue" => handle_queue_command(st).await,
            "call-medic" => handle_call_medic_command(sender_id),
            _ => json!({
                "type": 4,
                "data": {
                    "content": "❌ ไม่พบคำสั่งที่ระบุ",
                    "flags": 64 // Ephemeral
                }
            }),
        }
    } else {
        json!({
            "type": 4,
            "data": { "content": "Unsupported interaction type" }
        })
    }
}

async fn handle_duty_command(st: &AppState) -> Value {
    let active_logs: Vec<ActiveDutyRow> = st
        .db
        .select(
            "duty_logs",
            &[
                ("select", "discord_id,clock_in,duty_type".into()),
                ("status", db::eq("on_duty")),
            ],
        )
        .await
        .unwrap_or_default();

    let users: Vec<UserMetaRow> = st
        .db
        .select("users", &[("select", "discord_id,ic_name".into())])
        .await
        .unwrap_or_default();

    let name_map: std::collections::HashMap<String, String> = users
        .into_iter()
        .map(|u| (u.discord_id, u.ic_name.unwrap_or_else(|| "Unknown".to_string())))
        .collect();

    let count = active_logs.len();
    let mut description = format!("ขณะนี้มีแพทย์ปฏิบัติหน้าที่อยู่ทั้งหมด **{count}** ท่าน:\n\n");

    if count == 0 {
        description.push_str("⚠️ *ขณะนี้ยังไม่มีแพทย์เข้าเวรในเมือง*\n");
    } else {
        for (i, log) in active_logs.iter().enumerate() {
            let name = name_map.get(&log.discord_id).map(|s| s.as_str()).unwrap_or("แพทย์");
            let special_badge = match log.duty_type.as_deref() {
                Some("mentor") => " 🌟 [พี่เลี้ยง]",
                Some("exam") => " 📝 [สอบหมอ]",
                _ => "",
            };
            description.push_str(&format!("{}. **{}** (<@{}>){}\n", i + 1, name, log.discord_id, special_badge));
        }
    }

    json!({
        "type": 4,
        "data": {
            "embeds": [{
                "title": "🩺 รายชื่อแพทย์ที่กำลังปฏิบัติหน้าที่ (Live Duty)",
                "description": description,
                "color": 3066993, // Emerald green
                "footer": {
                    "text": "Medic E-Service V2 • WIP TOWN Medical Service"
                },
                "timestamp": Utc::now().to_rfc3339()
            }]
        }
    })
}

async fn handle_queue_command(st: &AppState) -> Value {
    let rows: Vec<QueueStatusRow> = st
        .db
        .select(
            "queue_status",
            &[
                ("select", "discord_id,status".into()),
            ],
        )
        .await
        .unwrap_or_default();

    let manager = rows.iter().find(|r| r.status.as_deref() == Some("manager"));
    let queued = rows.iter().find(|r| r.status.as_deref() == Some("queued"));
    let unavailable_count = rows.iter().filter(|r| r.status.as_deref() == Some("unavailable")).count();

    let manager_desc = match manager {
        Some(m) => format!("👑 <@{}>", m.discord_id),
        None => "*(ยังไม่มีผู้จัดการคิว)*".to_string(),
    };

    let queued_desc = match queued {
        Some(q) => format!("🟢 <@{}>", q.discord_id),
        None => "*(ไม่มีแพทย์ที่กำลังรับคิว)*".to_string(),
    };

    let description = format!(
        "**ผู้จัดการคิวปัจจุบัน:** {}\n**แพทย์พร้อมรับคิว:** {}\n**แพทย์ที่ไม่สะดวก:** {} ท่าน\n",
        manager_desc, queued_desc, unavailable_count
    );

    json!({
        "type": 4,
        "data": {
            "embeds": [{
                "title": "📋 สถานะระบบรับคิวแพทย์ (Queue Status)",
                "description": description,
                "color": 10181046, // Purple
                "footer": {
                    "text": "Medic E-Service V2 • WIP TOWN Medical Service"
                },
                "timestamp": Utc::now().to_rfc3339()
            }]
        }
    })
}

fn handle_call_medic_command(sender_id: &str) -> Value {
    json!({
        "type": 4,
        "data": {
            "content": format!("🚨 **[ฉุกเฉิน / EMERGENCY CALL]**\nแพทย์ <@{sender_id}> ได้ทำการส่งสัญญาณเรียกรวมพลแพทย์ด่วนเข้าเมือง ขอให้แพทย์ที่สะดวกเข้าเวรปฏิบัติหน้าที่โดยเร็วที่สุด! @here"),
            "embeds": [{
                "title": "📢 ประกาศเรียกรวมพลแพทย์ (Emergency Mobilization)",
                "description": "มีเหตุการณ์เร่งด่วนในเมือง ต้องการกำลังพลแพทย์สนับสนุนทันที กรุณาเข้าเวรผ่านหน้าเว็บ https://medic.wiptown.com/duty",
                "color": 15158332, // Red
                "timestamp": Utc::now().to_rfc3339()
            }]
        }
    })
}
