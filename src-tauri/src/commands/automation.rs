use serde::Deserialize;
use tauri::{AppHandle, State};

use crate::automation::executor::execute_rule;
use crate::automation::matcher::{AutomationEvent, match_rule};
use crate::automation::validation::validate_rule;
use crate::db::models::{AutomationInput, AutomationRule, LogsInput, LogsList};
use crate::db::{DbState, repo, run};

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TestRuleInput {
    pub rule_id: String,
    pub message: String,
    pub title: Option<String>,
}

#[tauri::command]
pub async fn list_rules(state: tauri::State<'_, DbState>) -> Result<Vec<AutomationRule>, String> {
    run(state, repo::list_rules).await
}

#[tauri::command]
pub async fn create_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationInput,
) -> Result<AutomationRule, String> {
    validate_rule(&rule)?;
    run(state, move |conn| repo::create_rule(conn, rule)).await
}

#[tauri::command]
pub async fn update_rule(
    state: tauri::State<'_, DbState>,
    rule: AutomationInput,
) -> Result<AutomationRule, String> {
    validate_rule(&rule)?;
    run(state, move |conn| repo::update_rule(conn, rule)).await
}

#[tauri::command]
pub async fn delete_rule(state: tauri::State<'_, DbState>, rule_id: String) -> Result<(), String> {
    run(state, move |conn| repo::delete_rule(conn, &rule_id)).await
}

#[tauri::command]
pub async fn toggle_rule(
    state: tauri::State<'_, DbState>,
    rule_id: String,
) -> Result<AutomationRule, String> {
    run(state, move |conn| repo::toggle_rule(conn, &rule_id)).await
}

#[tauri::command]
pub async fn test_rule(
    app: AppHandle,
    state: State<'_, DbState>,
    input: TestRuleInput,
) -> Result<AutomationRule, String> {
    let rule_id = input.rule_id.clone();

    let rule = run(state.clone(), move |conn| repo::get_rule(conn, &rule_id)).await?;

    let event = AutomationEvent {
        topic: rule.topic.clone(),
        title: input.title.clone(),
        message: input.message.clone(),
    };

    let result = match match_rule(&rule, &event) {
        Some(context) => execute_rule(&app, &rule, &context).await,
        None => Err("Test message did not match this rule".to_string()),
    };

    let status = if result.is_ok() { "success" } else { "failed" };

    let error = result.as_ref().err().cloned();

    let updated_rule = run(state, move |conn| {
        repo::record_execution(conn, &rule, input.title, Some(input.message), status, error)
    })
    .await?;

    match result {
        Ok(()) => Ok(updated_rule),
        Err(error) => Err(error),
    }
}

#[tauri::command]
pub async fn list_logs(
    state: tauri::State<'_, DbState>,
    input: LogsInput,
) -> Result<LogsList, String> {
    run(state, move |conn| repo::list_logs(conn, input)).await
}
