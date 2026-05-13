use tauri::{AppHandle, Listener};
use tauri_plugin_notification::NotificationExt;

pub fn listener(app_handle: &AppHandle) {
    let app_handle_clone = app_handle.clone();

    app_handle.listen("ntfy_notification", move |event| {
        let payload = event.payload();

        if let Ok(data) = serde_json::from_str::<serde_json::Value>(payload) {
            let title = data["title"].as_str().unwrap_or("ntfy");
            let body = data["body"].as_str().unwrap_or("");
            let _ = app_handle_clone
                .notification()
                .builder()
                .title(title)
                .body(body)
                .show();
        }
    });
}
