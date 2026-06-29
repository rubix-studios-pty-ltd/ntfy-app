use tauri::{AppHandle, Manager, WindowEvent};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::tray::system::sync_tray_label;

pub fn setup_window_events(window: &tauri::Window, event: &WindowEvent) {
    if window.label() != "main" {
        return;
    }

    if let WindowEvent::CloseRequested { api, .. } = event {
        api.prevent_close();

        let app = window.app_handle().clone();
        let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);

        hide_main_window(&app);
        sync_tray_label(&app);
    }
}

pub fn window_is_shown(app: &AppHandle) -> bool {
    let Some(window) = app.get_webview_window("main") else {
        return false;
    };

    let is_visible = window.is_visible().unwrap_or(false);
    let is_minimized = window.is_minimized().unwrap_or(false);

    is_visible && !is_minimized
}

pub fn window_tray_label(app: &AppHandle) -> &'static str {
    if window_is_shown(app) {
        "Hide"
    } else {
        "Show"
    }
}

pub fn hide_main_window(app: &AppHandle) -> &'static str {
    let Some(window) = app.get_webview_window("main") else {
        return "Show";
    };

    let _ = window.set_skip_taskbar(true);
    let _ = window.hide();

    "Show"
}

pub fn show_main_window(app: &AppHandle) -> &'static str {
    let Some(window) = app.get_webview_window("main") else {
        return "Show";
    };

    let _ = window.set_skip_taskbar(false);
    let _ = window.show();
    let _ = window.unminimize();
    let _ = window.set_focus();

    "Hide"
}

pub fn toggle_main_window(app: &AppHandle) -> &'static str {
    if window_is_shown(app) {
        hide_main_window(app)
    } else {
        show_main_window(app)
    }
}