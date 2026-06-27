mod automation;
mod autostart;
mod commands;
mod config;
mod db;
mod listener;
mod modules;
mod overrides;
mod tray;
mod windows;

use overrides::handle_page_load;
use tray::setup_tray;
use windows::main::setup_window_events;

use tauri::Manager;

const LOG_RETENTION_DAYS: u32 = 30;
const LOG_MAX_ROWS: u32 = 1000;

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(commands::handler())
        .on_window_event(|window, event| {
            setup_window_events(window, event);
        })
        .setup(|app| {
            let db_state = db::init(app.handle())?;
            app.manage(db_state);

            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                if let Err(error) = db::run(handle.state::<db::DbState>(), |conn| {
                    db::repo::cleanup_logs(conn, LOG_RETENTION_DAYS, LOG_MAX_ROWS)
                })
                .await
                {
                    eprintln!("Failed to clean automation logs: {error}");
                }
            });

            listener::listener(app.handle());
            setup_tray(app)?;

            Ok(())
        })
        .on_page_load(|window, _payload| {
            handle_page_load(window);
        })
        .build(tauri::generate_context!())
        .expect("Error while building application");

    app.run(|_app_handle, _event| {});
}
