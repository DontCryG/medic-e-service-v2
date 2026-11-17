use std::time::Duration;
use reqwest::Client;
use crate::config::Config;
use crate::db::Db;

pub struct AppState {
    pub http: Client,
    pub db: Db,
    pub supabase_url: String,
    pub anon_key: String,
    pub discord_webhook_url: Option<String>,
    pub discord_bot_token: Option<String>,
    pub discord_application_id: Option<String>,
    #[allow(dead_code)]
    pub discord_public_key: Option<String>,
}

impl AppState {
    pub fn new(cfg: &Config) -> Self {
        let http = Client::builder()
            .timeout(Duration::from_secs(15))
            .build()
            .expect("Failed to initialize HTTP client");

        Self {
            db: Db::new(http.clone(), &cfg.supabase_url, cfg.db_key.clone()),
            http,
            supabase_url: cfg.supabase_url.clone(),
            anon_key: cfg.anon_key.clone(),
            discord_webhook_url: cfg.discord_webhook_url.clone(),
            discord_bot_token: cfg.discord_bot_token.clone(),
            discord_application_id: cfg.discord_application_id.clone(),
            discord_public_key: cfg.discord_public_key.clone(),
        }
    }
}
