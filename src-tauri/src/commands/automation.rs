use crate::automation::validation::validate_rule;
use crate::db::models::{LogsInput, LogsList};
use crate::db::{DbState, models::AutomationInput, repo};

#[tauri::command]
pub async fn list_rules(
    state: tauri::State<'_, DbState>,
) -> Result<Vec<crate::db::models::AutomationRule>, String> {
    crate::db::run(state, repo::list_rules).await
}

#[tauri::command]
pub async fn create_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationInput,
) -> Result<crate::db::models::AutomationRule, String> {
    validate_rule(&rule)?;
    crate::db::run(state, move |conn| repo::create_rule(conn, rule)).await
}

#[tauri::command]
pub async fn update_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationInput,
) -> Result<crate::db::models::AutomationRule, String> {
    validate_rule(&rule)?;
    crate::db::run(state, move |conn| repo::update_rule(conn, rule)).await
}

#[tauri::command]
pub async fn delete_rule(state: tauri::State<'_, DbState>, rule_id: String) -> Result<(), String> {
    crate::db::run(state, move |conn| repo::delete_rule(conn, &rule_id)).await
}

#[tauri::command]
pub async fn toggle_rule(
    state: tauri::State<'_, DbState>,
    rule_id: String,
) -> Result<crate::db::models::AutomationRule, String> {
    crate::db::run(state, move |conn| repo::toggle_rule(conn, &rule_id)).await
}

#[tauri::command]
pub async fn test_rule(
    state: tauri::State<'_, DbState>,
    rule_id: String,
) -> Result<crate::db::models::AutomationRule, String> {
    crate::db::run(state, move |conn| repo::test_rule(conn, &rule_id)).await
}

#[tauri::command]
pub async fn list_logs(
    state: tauri::State<'_, DbState>,
    input: LogsInput,
) -> Result<LogsList, String> {
    crate::db::run(state, move |conn| repo::list_logs(conn, input)).await
}
