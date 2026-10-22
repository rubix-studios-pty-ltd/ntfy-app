use chrono::{Datelike, Local, Timelike, Weekday};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::automation::engine::handle_notification;
use crate::db::{DbState, models::DayKey, repo, run};
use crate::ntfy::models::{Message, Topic};

#[derive(Clone)]
pub(crate) struct Payload {
    pub(crate) topic: String,
    pub(crate) title: Option<String>,
    pub(crate) message: String,
}

pub(crate) async fn process_notification(
    app: &AppHandle,
    topic: &Topic,
    message: &Message,
) -> Result<(), String> {
    let id = topic.id.clone();

    let stored = message.clone();

    let fresh = run(app.state::<DbState>(), move |connection| {
        repo::ntfy::receive(connection, &id, &stored)
    })
    .await?;

    if !fresh {
        return Ok(());
    }

    let _ = app.emit("ntfy:changed", ());

    if message.event != "message" {
        return Ok(());
    }

    if !topic.muted && should_show_notification(app).await? {
        let title = message
            .title
            .as_deref()
            .filter(|title| !title.is_empty())
            .unwrap_or(&message.topic);

        let preview = run(app.state::<DbState>(), |connection| {
            Ok(repo::ntfy::meta(connection, "notification_preview")?.as_deref() == Some("1"))
        })
        .await?;

        let mut builder = app
            .notification()
            .builder()
            .title(if preview { title } else { "Ntfy" });

        builder = builder.body(if preview {
            &message.message
        } else {
            "New notification. Open Ntfy to view it."
        });

        if builder.show().is_err() {
            let _ = app.emit(
                "ntfy:delivery-error",
                "Native notification delivery failed. Check operating system permissions.",
            );
        }
    }

    if let Err(_error) = handle_notification(
        app,
        Payload {
            topic: message.topic.clone(),
            title: message.title.clone(),
            message: message.message.clone(),
        },
    )
    .await
    {
        let _ = app.emit(
            "ntfy:delivery-error",
            "An automation failed. Review the encrypted automation logs.",
        );
    }

    Ok(())
}

async fn should_show_notification(app: &AppHandle) -> Result<bool, String> {
    let schedule = run(app.state::<DbState>(), repo::get_schedule).await?;

    if !schedule.schedule_enabled {
        return Ok(true);
    }

    let now = Local::now();

    let day_key = match now.weekday() {
        Weekday::Mon => DayKey::Monday,
        Weekday::Tue => DayKey::Tuesday,
        Weekday::Wed => DayKey::Wednesday,
        Weekday::Thu => DayKey::Thursday,
        Weekday::Fri => DayKey::Friday,
        Weekday::Sat => DayKey::Saturday,
        Weekday::Sun => DayKey::Sunday,
    };

    let Some(day) = schedule.days.get(&day_key) else {
        return Ok(false);
    };

    if !day.enabled {
        return Ok(false);
    }

    let current = now.hour() * 60 + now.minute();

    let start = repo::time_to_minutes(&day.start_time)
        .ok_or_else(|| "Invalid schedule start time".to_string())?;

    let end = repo::time_to_minutes(&day.end_time)
        .ok_or_else(|| "Invalid schedule end time".to_string())?;
    
    Ok(current >= u32::from(start) && current < u32::from(end))
}
