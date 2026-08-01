use std::collections::{HashSet, VecDeque};
use std::sync::Mutex;

use chrono::{Datelike, Local, Timelike, Weekday};
use serde::Deserialize;
use tauri::{AppHandle, Listener, Manager};
use tauri_plugin_notification::NotificationExt;

use crate::automation::engine::handle_notification;
use crate::db::models::DayKey;
use crate::db::{DbState, repo, run};

const SEEN_NOTIFICATION_LIMIT: usize = 1000;

#[derive(Debug, Clone, Deserialize)]
pub(crate) struct Payload {
    #[serde(default)]
    pub(crate) id: Option<String>,
    #[serde(default)]
    pub(crate) time: Option<i64>,
    pub(crate) topic: String,
    pub(crate) title: Option<String>,
    pub(crate) message: String,
}

#[derive(Default)]
pub struct NotificationState {
    seen: Mutex<SeenNotifications>,
}

#[derive(Default)]
struct SeenNotifications {
    keys: HashSet<String>,
    order: VecDeque<String>,
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
            process_notification(&app, notification).await;
        });
    });
}

pub(crate) async fn process_notification(app: &AppHandle, notification: Payload) {
    if notification.message.trim().is_empty() || !mark_seen(app, &notification) {
        return;
    }

    match should_show_notification(app).await {
        Ok(true) => {
            show_notification(app, &notification);
        }

        Ok(false) => {
            // Notifications are disabled by schedule
        }

        Err(error) => {
            eprintln!("Schedule check failed: {error}");

            show_notification(app, &notification);
        }
    }

    if let Err(error) = handle_notification(app, notification).await {
        eprintln!("Automation execution failed: {error}");
    }
}

fn mark_seen(app: &AppHandle, notification: &Payload) -> bool {
    let key = notification
        .id
        .as_deref()
        .filter(|id| !id.trim().is_empty())
        .map(|id| format!("id:{}:{id}", notification.topic))
        .unwrap_or_else(|| {
            format!(
                "fallback:{}:{}:{}",
                notification.time.unwrap_or_default(),
                notification.topic,
                notification.message
            )
        });

    let state = app.state::<NotificationState>();
    let Ok(mut seen) = state.seen.lock() else {
        return true;
    };

    if !seen.keys.insert(key.clone()) {
        return false;
    }

    seen.order.push_back(key);

    while seen.order.len() > SEEN_NOTIFICATION_LIMIT {
        if let Some(expired) = seen.order.pop_front() {
            seen.keys.remove(&expired);
        }
    }

    true
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
    let day_key = day_of_week(now.weekday());

    let Some(day) = schedule.days.get(&day_key) else {
        return Ok(false);
    };

    if !day.enabled {
        return Ok(false);
    }

    let current = (now.hour() as u16 * 60) + now.minute() as u16;

    let start = repo::time_to_minutes(&day.start_time)
        .ok_or_else(|| format!("Invalid start time for {}", day_key.as_str()))?;

    let end = repo::time_to_minutes(&day.end_time)
        .ok_or_else(|| format!("Invalid end time for {}", day_key.as_str()))?;

    Ok(current >= start && current < end)
}

fn day_of_week(days: Weekday) -> DayKey {
    match days {
        Weekday::Mon => DayKey::Monday,
        Weekday::Tue => DayKey::Tuesday,
        Weekday::Wed => DayKey::Wednesday,
        Weekday::Thu => DayKey::Thursday,
        Weekday::Fri => DayKey::Friday,
        Weekday::Sat => DayKey::Saturday,
        Weekday::Sun => DayKey::Sunday,
    }
}
