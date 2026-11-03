use serde::{Deserialize, Serialize};
use zeroize::{Zeroize, ZeroizeOnDrop};

#[derive(Clone, Deserialize, Zeroize, ZeroizeOnDrop)]
#[serde(rename_all = "camelCase")]
pub struct ServerInput {
    pub id: Option<String>,
    pub name: String,
    pub url: String,
    pub auth_kind: String,
    pub username: String,
    pub secret: Option<String>,
}

#[derive(Clone, Zeroize, ZeroizeOnDrop)]
pub struct Credentials {
    pub auth_kind: String,
    pub username: String,
    pub secret: String,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Server {
    pub id: String,
    pub name: String,
    pub url: String,
    pub auth_kind: String,
    pub username: String,
    pub enabled: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Topic {
    pub id: String,
    pub server_id: String,
    pub topic: String,
    pub muted: bool,
    pub unread: u32,
    pub subscribed_at: i64,
    pub cursor_time: Option<i64>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Message {
    pub id: String,
    pub time: i64,
    pub event: String,
    pub topic: String,
    pub title: Option<String>,
    #[serde(default)]
    pub message: String,
    #[serde(default)]
    pub priority: Option<u8>,
    #[serde(default)]
    pub tags: Vec<String>,
    pub click: Option<String>,
    pub attachment: Option<Attachment>,
    #[serde(default)]
    pub actions: Vec<serde_json::Value>,
    pub expires: Option<i64>,
    pub sequence_id: Option<String>,
}

#[derive(Clone, Deserialize, Serialize)]
pub struct Attachment {
    pub name: String,
    pub url: String,
    pub size: Option<u64>,
    pub expires: Option<i64>,
    #[serde(rename = "type")]
    pub content_type: Option<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredMessage {
    pub row_id: i64,
    pub topic_id: String,
    pub is_read: bool,
    pub message: Message,
}

#[derive(Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MessageQuery {
    pub topic_id: Option<String>,
    pub before: Option<i64>,
    pub unread_only: bool,
    #[serde(default)]
    pub search: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Snapshot {
    pub servers: Vec<Server>,
    pub topics: Vec<Topic>,
    pub statuses: Vec<ConnectionStatus>,
    pub encrypted: bool,
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConnectionStatus {
    pub topic_id: String,
    pub state: String,
    pub detail: Option<String>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PublishInput {
    pub topic_id: String,
    pub title: String,
    pub message: String,
    pub priority: u8,
    pub tags: Vec<String>,
}
