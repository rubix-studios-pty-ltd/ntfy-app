mod autostart;
mod commands;
mod config;
mod listener;
mod overrides;
mod tray;
mod windows;

use commands::{get_url, set_url};
use overrides::handle_page_load;
use tray::setup_tray;
use windows::main::setup_window_events;

pub fn run() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![get_url, set_url])
        .on_window_event(|window, event| {
            setup_window_events(window, event);
        })
        .setup(|app| {
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
