use std::sync::atomic::{AtomicBool, Ordering};

use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder, WindowEvent};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use url::Url;

use crate::background::{cancel_webview_unload, request_webview_unload};
use crate::config::load_config;
use crate::tray::system::sync_tray_label;

static MAIN_WINDOW_BUILDING: AtomicBool = AtomicBool::new(false);

pub fn setup_window_events(window: &tauri::Window, event: &WindowEvent) {
    if window.label() != "main" {
        return;
    }

    match event {
        WindowEvent::CloseRequested { api, .. } => {
            api.prevent_close();

            let app = window.app_handle().clone();
            let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);

            hide_main_window(&app);
            sync_tray_label(&app);
        }

        WindowEvent::Resized(_) if window.is_minimized().unwrap_or(false) => {
            let app = window.app_handle().clone();
            let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);

            hide_main_window(&app);
            sync_tray_label(&app);
        }

        _ => {}
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
    if window_is_shown(app) { "Hide" } else { "Show" }
}

pub fn hide_main_window(app: &AppHandle) -> &'static str {
    let Some(window) = app.get_webview_window("main") else {
        return "Show";
    };

    let _ = window.set_skip_taskbar(true);
    let _ = window.hide();

    request_webview_unload(app);

    "Show"
}

pub fn show_main_window(app: &AppHandle) -> &'static str {
    cancel_webview_unload(app);

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_skip_taskbar(false);
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();

        return "Hide";
    }

    if MAIN_WINDOW_BUILDING.swap(true, Ordering::AcqRel) {
        return "Hide";
    }

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        match create_main_window(&app) {
            Ok(window) => {
                let _ = window.set_skip_taskbar(false);
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
            }

            Err(error) => {
                eprintln!("Failed to recreate the main webview: {error}");
            }
        }

        MAIN_WINDOW_BUILDING.store(false, Ordering::Release);
        sync_tray_label(&app);
    });

    "Hide"
}

fn create_main_window(app: &AppHandle) -> tauri::Result<tauri::WebviewWindow> {
    let url = main_window_url(app);

    WebviewWindowBuilder::new(app, "main", url)
        .title("Ntfy")
        .inner_size(1000.0, 600.0)
        .min_inner_size(400.0, 530.0)
        .resizable(true)
        .fullscreen(false)
        .decorations(true)
        .center()
        .skip_taskbar(false)
        .visible(false)
        .build()
}

pub fn toggle_main_window(app: &AppHandle) -> &'static str {
    if window_is_shown(app) {
        hide_main_window(app)
    } else {
        show_main_window(app)
    }
}

fn main_window_url(app: &AppHandle) -> WebviewUrl {
    let config = load_config(app);

    config
        .instance_url
        .and_then(|instance| Url::parse(&instance).ok())
        .map(WebviewUrl::External)
        .unwrap_or_else(|| WebviewUrl::App("/".into()))
}
