use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn open_webhook_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("webhook") {
        let _ = window.show();
        let _ = window.set_focus();

        return;
    }

    if let Err(error) =
        WebviewWindowBuilder::new(app, "webhook", WebviewUrl::App("/webhook".into()))
            .title("Ntfy")
            .inner_size(400.0, 500.0)
            .resizable(true)
            .fullscreen(false)
            .decorations(true)
            .visible(false)
            .center()
            .skip_taskbar(true)
            .build()
    {
        eprintln!("Failed to create webhook window: {error}");
    }
}
