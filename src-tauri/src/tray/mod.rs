use tauri::AppHandle;
use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

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

pub fn exit_app(app: &tauri::AppHandle) {
    let _ = app.save_window_state(StateFlags::SIZE | StateFlags::POSITION);

    app.exit(0);
}
