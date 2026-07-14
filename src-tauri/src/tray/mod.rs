use tauri::{AppHandle, Manager};
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

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
    if let Err(error) = clear_instance(app) {
        eprintln!("Failed to reset instance URL: {error}");
    }

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.clear_all_browsing_data();
    }

    app.restart();
}

pub fn exit_app(app: &tauri::AppHandle) {
    let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);
    std::process::exit(0);
}
