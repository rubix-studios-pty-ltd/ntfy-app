use tauri::WindowEvent;

pub fn setup_window_events(window: &tauri::Window, event: &WindowEvent) {
    if window.label() == "webhook" {
        return;
    }

    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();

        let _ = window.hide();
    }
}
