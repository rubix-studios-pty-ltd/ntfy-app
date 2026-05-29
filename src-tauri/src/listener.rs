use serde::Deserialize;
use tauri::{AppHandle, Listener};
use tauri_plugin_notification::NotificationExt;

use crate::automation::engine::handle_notification;

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

        let title = notification
            .title
            .as_deref()
            .filter(|value| !value.trim().is_empty())
            .unwrap_or("ntfy");

        let _ = app_handle_clone
            .notification()
            .builder()
            .title(title)
            .body(&notification.message)
            .show();

        let app = app_handle_clone.clone();

        tauri::async_runtime::spawn(async move {
            if let Err(error) = handle_notification(&app, notification).await {
                eprintln!("Automation execution failed: {error}");
            }
        });
    });
}
