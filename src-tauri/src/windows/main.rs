use tauri::{Manager, WindowEvent};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

pub fn setup_window_events(window: &tauri::Window, event: &WindowEvent) {
    if window.label() != "main" {
        return;
    }

    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();

        let _ = window
            .app_handle()
            .save_window_state(StateFlags::SIZE | StateFlags::POSITION);

        let window = window.clone();

        tauri::async_runtime::spawn(async move {
            let _ = window.hide();
        });
    }
}
