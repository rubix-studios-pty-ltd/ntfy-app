use chrono::{Datelike, Local, Timelike, Weekday};
use serde::Deserialize;
use tauri::{AppHandle, Listener, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::automation::engine::handle_notification;
use crate::db::models::DayKey;
use crate::db::{DbState, repo, run};

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct Payload {
    pub(crate) topic: String,
    pub(crate) title: Option<String>,
    pub(crate) message: String,
}

pub fn listener(app_handle: &AppHandle) {
    let app_handle_clone = app_handle.clone();

    app_handle.listen("ntfy_notification", move |event| {
        let payload = event.payload();

        let Ok(notification) = serde_json::from_str::<Payload>(payload) else {
            return;
        };

        let app = app_handle_clone.clone();

        tauri::async_runtime::spawn(async move {
            match should_show_notification(&app).await {
                Ok(true) => {
                    show_notification(&app, &notification);
                }

                Ok(false) => {}

                Err(error) => {
                    eprintln!("Schedule check failed: {error}");

                    show_notification(&app, &notification);
                }
            }

            if let Err(error) = handle_notification(&app, notification).await {
                eprintln!("Automation execution failed: {error}");
            }
        });
    });
}

fn show_notification(app: &AppHandle, notification: &Payload) {
    let title = notification
        .title
        .as_deref()
        .filter(|value| !value.trim().is_empty())
        .unwrap_or("ntfy");

    let _ = app
        .notification()
        .builder()
        .title(title)
        .body(&notification.message)
        .show();
}

async fn should_show_notification(app: &AppHandle) -> Result<bool, String> {
    let schedule = run(app.state::<DbState>(), repo::get_schedule).await?;

    if !schedule.schedule_enabled {
        return Ok(true);
    }

    let now = Local::now();
    let day_key = day_key_from_weekday(now.weekday());

    let Some(day) = schedule.days.get(&day_key) else {
        return Ok(false);
    };

    if !day.enabled {
        return Ok(false);
    }

    let current = (now.hour() as u16 * 60) + now.minute() as u16;

    let start = time_to_minutes(&day.start_time)
        .ok_or_else(|| format!("Invalid start time for {}", day_key.as_str()))?;

    let end = time_to_minutes(&day.end_time)
        .ok_or_else(|| format!("Invalid end time for {}", day_key.as_str()))?;

    Ok(current >= start && current < end)
}

fn day_key_from_weekday(weekday: Weekday) -> DayKey {
    match weekday {
        Weekday::Mon => DayKey::Monday,
        Weekday::Tue => DayKey::Tuesday,
        Weekday::Wed => DayKey::Wednesday,
        Weekday::Thu => DayKey::Thursday,
        Weekday::Fri => DayKey::Friday,
        Weekday::Sat => DayKey::Saturday,
        Weekday::Sun => DayKey::Sunday,
    }
}

fn time_to_minutes(value: &str) -> Option<u16> {
    let mut parts = value.split(':');

    let hour = parts.next()?.parse::<u16>().ok()?;
    let minute = parts.next()?.parse::<u16>().ok()?;

    if parts.next().is_some() || hour > 23 || minute > 59 {
        return None;
    }

    Some((hour * 60) + minute)
}
