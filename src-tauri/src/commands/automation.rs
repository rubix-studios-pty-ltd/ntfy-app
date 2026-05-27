use crate::db::{DbState, models::AutomationRuleInput, repo};

#[tauri::command]
pub async fn list_rules(
    state: tauri::State<'_, DbState>,
) -> Result<Vec<crate::db::models::AutomationRule>, String> {
    crate::db::run(state, |conn| repo::list_rules(conn)).await
}

#[tauri::command]
pub async fn create_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationRuleInput,
) -> Result<crate::db::models::AutomationRule, String> {
    crate::db::run(state, move |conn| repo::create_rule(conn, rule)).await
}

#[tauri::command]
pub async fn update_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationRuleInput,
) -> Result<crate::db::models::AutomationRule, String> {
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
pub async fn rule_logs(
    state: tauri::State<'_, DbState>,
    rule_id: String,
) -> Result<Vec<crate::db::models::AutomationLog>, String> {
    crate::db::run(state, move |conn| repo::rule_logs(conn, &rule_id)).await
}
