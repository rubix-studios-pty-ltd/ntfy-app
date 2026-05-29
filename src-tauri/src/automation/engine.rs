use tauri::{AppHandle, Manager};

use crate::automation::matcher::{AutomationEvent, match_rule};
use crate::db::{DbState, repo};
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

    let state = app.state::<DbState>();

    let rules = crate::db::run(state, repo::list_rules).await?;

    for rule in rules.into_iter().filter(|rule| rule.active) {
        let Some(context) = match_rule(&rule, &event) else {
            continue;
        };

        // Next layer:
        // execute_rule(app, &rule, &context).await;
        // insert log success/failed
        // update rule status + last_run
    }

    Ok(())
}
