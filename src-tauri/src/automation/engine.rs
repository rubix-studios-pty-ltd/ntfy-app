use tauri::{AppHandle, Manager};

use crate::automation::executor::execute_rule;
use crate::automation::matcher::{AutomationEvent, match_rule};
use crate::db::{DbState, models::LogAutomationInput, repo};
use crate::listener::Payload;

pub async fn handle_notification(app: &AppHandle, notification: Payload) -> Result<(), String> {
    if notification.topic.trim().is_empty() || notification.message.trim().is_empty() {
        return Ok(());
    }

    let event = AutomationEvent {
        topic: notification.topic,
        title: notification.title,
        message: notification.message,
    };

    let rules = crate::db::run(app.state::<DbState>(), repo::list_rules).await?;

    for rule in rules.into_iter().filter(|rule| rule.active) {
        let Some(context) = match_rule(&rule, &event) else {
            continue;
        };

        let result = execute_rule(app, &rule, &context).await;

        let status = if result.is_ok() { "success" } else { "failed" };

        let error = result.as_ref().err().cloned();

        let log = LogAutomationInput {
            rule_id: rule.id.clone(),
            rule_name: rule.name.clone(),
            topic: Some(event.topic.clone()),
            title: event.title.clone(),
            message: Some(event.message.clone()),
            action_type: rule.action_type.clone(),
            action_value: rule.action_value.clone(),
            module_id: rule.module_id.clone(),
            status: status.to_string(),
            error,
        };

        crate::db::run(app.state::<DbState>(), move |conn| {
            repo::create_log(conn, log)
        })
        .await?;

        let rule_id = rule.id.clone();
        let status_value = status.to_string();

        crate::db::run(app.state::<DbState>(), move |conn| {
            repo::rule_execution(conn, &rule_id, &status_value)
        })
        .await?;
    }

    Ok(())
}
