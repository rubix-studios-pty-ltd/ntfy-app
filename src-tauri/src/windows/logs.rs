use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn open_logs_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("logs") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();

        return;
    }

    match WebviewWindowBuilder::new(app, "logs", WebviewUrl::App("/logs".into()))
        .title("Ntfy")
        .inner_size(800.0, 800.0)
        .min_inner_size(800.0, 800.0)
        .resizable(true)
        .fullscreen(false)
        .decorations(true)
        .center()
        .skip_taskbar(true)
        .build()
    {
        Ok(window) => {
            let _ = window.show();
            let _ = window.set_focus();
        }
        Err(error) => {
            eprintln!("Failed to create logs window: {error}");
        }
    }
}
