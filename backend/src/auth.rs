use std::sync::Arc;
use axum::extract::FromRequestParts;
use axum::http::header;
use axum::http::request::Parts;
use serde::Deserialize;
use serde_json::Value;
use crate::db::eq;
use crate::error::AppError;
use crate::state::AppState;

/// A logged-in staff member. The Discord ID comes from the verified Supabase
/// login token, never from the request body, so nobody can act as someone else.
pub struct AuthUser {
    pub discord_id: String,
    pub role: String,
}

impl AuthUser {
    pub fn is_admin(&self) -> bool {
        self.role == "admin" || self.role == "superadmin"
    }
}

#[derive(Deserialize)]
struct RoleRow {
    role: Option<String>,
}

impl FromRequestParts<Arc<AppState>> for AuthUser {
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &Arc<AppState>) -> Result<Self, Self::Rejection> {
        let token = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .ok_or(AppError::Unauthorized)?;

        // Supabase Auth checks the token signature and expiry for us.
        let res = state
            .http
            .get(format!("{}/auth/v1/user", state.supabase_url))
            .header("apikey", &state.anon_key)
            .bearer_auth(token)
            .send()
            .await?;
        if !res.status().is_success() {
            return Err(AppError::Unauthorized);
        }
        let user: Value = res.json().await?;
        let discord_id = discord_id_of(&user).ok_or(AppError::Unauthorized)?;

        let rows: Vec<RoleRow> = state
            .db
            .select("users", &[("select", "role".into()), ("discord_id", eq(&discord_id))])
            .await?;
        let role = rows.into_iter().next().and_then(|r| r.role).unwrap_or_default();
        match role.as_str() {
            "" | "user" | "resigned" => Err(AppError::Forbidden),
            _ => Ok(Self { discord_id, role }),
        }
    }
}

/// Same lookup as Portal.tsx: provider_id first, then the Discord identity.
fn discord_id_of(user: &Value) -> Option<String> {
    user["user_metadata"]["provider_id"]
        .as_str()
        .map(str::to_owned)
        .or_else(|| {
            user["identities"]
                .as_array()?
                .iter()
                .find(|i| i["provider"] == "discord")?["id"]
                .as_str()
                .map(str::to_owned)
        })
}
