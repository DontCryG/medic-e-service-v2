use std::env;
use tracing::warn;

#[derive(Clone, Debug)]
pub struct Config {
    pub port: u16,
    pub supabase_url: String,
    /// Public key, used only to ask Supabase Auth who owns a login token.
    pub anon_key: String,
    /// Key used for database calls. Should be the service role key in production.
    pub db_key: String,
    pub cors_origin: String,
    pub discord_webhook_url: Option<String>,
    pub discord_bot_token: Option<String>,
    pub discord_application_id: Option<String>,
    pub discord_public_key: Option<String>,
}

fn var(names: &[&str]) -> Option<String> {
    names
        .iter()
        .find_map(|n| env::var(n).ok().filter(|v| !v.trim().is_empty()))
}

impl Config {
    pub fn from_env() -> Self {
        // backend/.env first, then the shared frontend .env (never overrides).
        let _ = dotenvy::dotenv();
        let _ = dotenvy::from_path("../.env");

        let supabase_url = var(&["SUPABASE_URL", "VITE_SUPABASE_URL"])
            .expect("SUPABASE_URL is not set")
            .trim_end_matches('/')
            .to_string();
        let anon_key = var(&["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"])
            .expect("SUPABASE_ANON_KEY is not set");
        let db_key = var(&["SUPABASE_SERVICE_ROLE_KEY"]).unwrap_or_else(|| {
            warn!("SUPABASE_SERVICE_ROLE_KEY is not set: using the anon key, so database rules (RLS) still decide what is allowed");
            anon_key.clone()
        });

        Self {
            port: var(&["PORT"]).and_then(|p| p.parse().ok()).unwrap_or(3001),
            supabase_url,
            anon_key,
            db_key,
            cors_origin: var(&["CORS_ORIGIN"]).unwrap_or_else(|| "*".to_string()),
            discord_webhook_url: var(&["DISCORD_WEBHOOK_URL"]),
            discord_bot_token: var(&["DISCORD_BOT_TOKEN"]),
            discord_application_id: var(&["DISCORD_APPLICATION_ID"]),
            discord_public_key: var(&["DISCORD_PUBLIC_KEY"]),
        }
    }
}
