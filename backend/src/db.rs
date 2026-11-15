use reqwest::{Client, Method, RequestBuilder};
use serde::de::DeserializeOwned;
use serde_json::Value;
use crate::error::AppError;

/// Thin client for the Supabase REST API (PostgREST).
/// Filters are passed as query pairs, so values are URL-encoded and cannot inject extra filters.
#[derive(Clone)]
pub struct Db {
    http: Client,
    rest_url: String,
    key: String,
}

pub fn eq(v: &str) -> String {
    format!("eq.{v}")
}

pub fn neq(v: &str) -> String {
    format!("neq.{v}")
}

impl Db {
    pub fn new(http: Client, supabase_url: &str, key: String) -> Self {
        Self { http, rest_url: format!("{supabase_url}/rest/v1"), key }
    }

    fn req(&self, method: Method, table: &str, query: &[(&str, String)]) -> RequestBuilder {
        self.http
            .request(method, format!("{}/{}", self.rest_url, table))
            .query(query)
            .header("apikey", &self.key)
            .bearer_auth(&self.key)
            .header("Prefer", "return=representation")
    }

    async fn send(rb: RequestBuilder) -> Result<Value, AppError> {
        let res = rb.send().await?;
        let status = res.status();
        let text = res.text().await?;
        if !status.is_success() {
            return Err(AppError::Upstream(format!("{status}: {text}")));
        }
        if text.is_empty() {
            return Ok(Value::Null);
        }
        serde_json::from_str(&text).map_err(|e| AppError::Upstream(format!("bad JSON: {e}")))
    }

    pub async fn select<T: DeserializeOwned>(&self, table: &str, query: &[(&str, String)]) -> Result<Vec<T>, AppError> {
        let v = Self::send(self.req(Method::GET, table, query)).await?;
        serde_json::from_value(v).map_err(|e| AppError::Upstream(format!("bad rows from {table}: {e}")))
    }

    pub async fn insert(&self, table: &str, body: &Value) -> Result<(), AppError> {
        Self::send(self.req(Method::POST, table, &[]).json(body)).await.map(|_| ())
    }

    pub async fn upsert(&self, table: &str, on_conflict: &str, body: &Value) -> Result<(), AppError> {
        let rb = self
            .http
            .request(Method::POST, format!("{}/{}", self.rest_url, table))
            .query(&[("on_conflict", on_conflict)])
            .header("apikey", &self.key)
            .bearer_auth(&self.key)
            .header("Prefer", "resolution=merge-duplicates,return=representation")
            .json(body);
        Self::send(rb).await.map(|_| ())
    }

    /// Returns how many rows changed (0 = filter matched nothing).
    pub async fn update(&self, table: &str, query: &[(&str, String)], body: &Value) -> Result<usize, AppError> {
        Self::send(self.req(Method::PATCH, table, query).json(body)).await.map(row_count)
    }

    /// Returns how many rows were deleted.
    pub async fn delete(&self, table: &str, query: &[(&str, String)]) -> Result<usize, AppError> {
        Self::send(self.req(Method::DELETE, table, query)).await.map(row_count)
    }
}

fn row_count(v: Value) -> usize {
    v.as_array().map_or(0, |a| a.len())
}
