use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::background;
use crate::config::clear_instance;

pub mod system;

pub fn check_updates(handle: &AppHandle) {
    let handle = handle.clone();

    tauri::async_runtime::spawn(async move {
        let updater = match handle.updater() {
            Ok(updater) => updater,
            Err(error) => {
                eprintln!("Failed to initialize updater: {error}");
                return;
            }
        };

        match updater.check().await {
            Ok(Some(update)) => {
                println!("Update available: {}", update.version);

                if let Err(error) = update
                    .download_and_install(|_chunk_length, _content_length| {}, || {})
                    .await
                {
                    eprintln!("Failed to install update: {error}");
                    return;
                }

                handle.restart();
            }
            Ok(None) => {
                println!("No updates available");
            }
            Err(error) => {
                eprintln!("Failed to check for updates: {error}");
            }
        }
    });
}

pub fn reset_instance(app: &tauri::AppHandle) {
    background::stop_all(app);

    if let Err(error) = clear_instance(app) {
        eprintln!("Failed to reset instance URL: {error}");
    }

    let existing_window = app.get_webview_window("main");

    if let Some(window) = existing_window {
        let _ = window.clear_all_browsing_data();

        app.restart();
    }

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        match WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("/".into()))
            .title("Ntfy")
            .visible(false)
            .build()
        {
            Ok(window) => {
                let _ = window.clear_all_browsing_data();
                let _ = window.destroy();
            }

            Err(error) => {
                eprintln!("Failed to create a webview for instance reset: {error}");
            }
        }

        app.restart();
    });
}

pub fn exit_app(app: &tauri::AppHandle) {
    let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);
    background::stop_all(app);
    std::process::exit(0);
}
