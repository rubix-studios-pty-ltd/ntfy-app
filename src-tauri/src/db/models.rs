use serde::{Deserialize, Serialize};

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
    pub action_value: String,
    pub arguments: Option<String>,
    pub working_directory: Option<String>,
    pub created_at: String,
    pub updated_at: String,
    pub last_run: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomationRuleInput {
    pub id: String,
    pub active: bool,
    pub name: String,
    pub topic: String,
    pub match_type: String,
    pub match_value: String,
    pub action_type: String,
    pub action_value: String,
    pub arguments: Option<String>,
    pub working_directory: Option<String>,
    pub last_run: Option<String>,
    pub status: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AutomationLog {
    pub id: String,
    pub rule_id: String,
    pub topic: Option<String>,
    pub title: Option<String>,
    pub message: Option<String>,
    pub action_type: String,
    pub action_value: String,
    pub status: String,
    pub error: Option<String>,
    pub created_at: String,
}
