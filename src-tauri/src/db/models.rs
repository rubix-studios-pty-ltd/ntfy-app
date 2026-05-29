use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

pub type ActionConfig = HashMap<String, Value>;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomationRule {
    pub id: String,
    pub active: bool,
    pub name: String,
    pub topic: String,
    pub match_type: String,
    pub match_value: String,
    pub action_type: String,
    pub action_value: Option<String>,
    pub module_id: Option<String>,
    pub action_config: Option<ActionConfig>,
    pub arguments: Option<String>,
    pub working_directory: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_run: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomationInput {
    pub id: String,
    pub active: bool,
    pub name: String,
    pub topic: String,
    pub match_type: String,
    pub match_value: String,
    pub action_type: String,
    pub action_value: Option<String>,
    pub module_id: Option<String>,
    pub action_config: Option<ActionConfig>,
    pub arguments: Option<String>,
    pub working_directory: Option<String>,
    pub last_run: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsAutomation {
    pub id: String,
    pub rule_id: String,
    pub rule_name: String,
    pub topic: Option<String>,
    pub title: Option<String>,
    pub message: Option<String>,
    pub action_type: String,
    pub action_value: Option<String>,
    pub module_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsInput {
    pub page: Option<u32>,
    pub page_size: Option<u32>,
    pub rule_id: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LogsList {
    pub items: Vec<LogsAutomation>,
    pub page: u32,
    pub page_size: u32,
    pub total: u32,
    pub total_pages: u32,
}
