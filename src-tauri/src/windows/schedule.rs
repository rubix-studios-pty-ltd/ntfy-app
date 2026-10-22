use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

pub fn open_schedule_window(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("schedule") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();

        return;
    }

    match WebviewWindowBuilder::new(app, "schedule", WebviewUrl::App("/schedule".into()))
        .incognito(true)
        .title("Ntfy")
        .inner_size(600.0, 810.0)
        .min_inner_size(600.0, 810.0)
        .resizable(true)
        .fullscreen(false)
        .decorations(true)
        .center()
        .skip_taskbar(false)
        .build()
    {
        Ok(window) => {
            let _ = window.show();
            let _ = window.set_focus();
        }
        Err(error) => {
            eprintln!("Failed to create schedule window: {error}");
        }
    }
}
