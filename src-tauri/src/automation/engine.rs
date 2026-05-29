use tauri::{AppHandle, Manager};

use crate::automation::executor::execute_rule;
use crate::automation::matcher::{AutomationEvent, match_rule};
use crate::db::{DbState, repo};
use crate::listener::Payload;

pub async fn handle_notification(app: &AppHandle, notification: Payload) -> Result<(), String> {
    let topic = notification.topic.trim().to_string();

    if topic.is_empty() || notification.message.trim().is_empty() {
        return Ok(());
    }

    let event = AutomationEvent {
        topic: topic.clone(),
        title: notification.title,
        message: notification.message,
    };

    let rules = crate::db::run(app.state::<DbState>(), move |conn| {
        repo::list_active_rules(conn, &topic)
    })
    .await?;

    for rule in rules {
        let Some(context) = match_rule(&rule, &event) else {
            continue;
        };

        let result = execute_rule(app, &rule, &context).await;

        let status = if result.is_ok() { "success" } else { "failed" };

        let error = result.as_ref().err().cloned();
        let title = event.title.clone();
        let message = event.message.clone();

        crate::db::run(app.state::<DbState>(), move |conn| {
            repo::test_run(conn, &rule, title, Some(message), status, error)
        })
        .await?;
    }

    Ok(())
}
