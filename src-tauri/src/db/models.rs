use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::{BTreeMap, HashMap};

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

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DayKey {
    Monday,
    Tuesday,
    Wednesday,
    Thursday,
    Friday,
    Saturday,
    Sunday,
}

impl DayKey {
    pub const ALL: [DayKey; 7] = [
        DayKey::Monday,
        DayKey::Tuesday,
        DayKey::Wednesday,
        DayKey::Thursday,
        DayKey::Friday,
        DayKey::Saturday,
        DayKey::Sunday,
    ];

    pub fn as_str(self) -> &'static str {
        match self {
            DayKey::Monday => "monday",
            DayKey::Tuesday => "tuesday",
            DayKey::Wednesday => "wednesday",
            DayKey::Thursday => "thursday",
            DayKey::Friday => "friday",
            DayKey::Saturday => "saturday",
            DayKey::Sunday => "sunday",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Schedule {
    pub schedule_enabled: bool,
    pub days: BTreeMap<DayKey, ScheduleConfig>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleConfig {
    pub enabled: bool,
    pub start_time: String,
    pub end_time: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ScheduleInput {
    pub schedule_enabled: bool,
    pub days: BTreeMap<DayKey, ScheduleConfig>,
}
