use tauri::Manager;

mod automation;
mod autostart;
mod commands;
mod db;
mod modules;
mod ntfy;
mod storage;
mod tray;
mod windows;

use windows::main::{setup_window_events, show_main_window};

pub fn run() {

    #[cfg(target_os = "linux")]
    unsafe {
        std::env::set_var("GDK_BACKEND", "wayland,x11");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(
            tauri::plugin::Builder::<tauri::Wry>::new("local-navigation")
                .on_navigation(|_webview, url| {
                    (url.scheme() == "tauri" && url.host_str() == Some("localhost"))
                        || (matches!(url.scheme(), "http" | "https")
                            && url.host_str() == Some("tauri.localhost")
                            && url.port().is_none())
                        || (cfg!(debug_assertions)
                            && url.scheme() == "http"
                            && url.host_str() == Some("localhost")
                            && url.port() == Some(5173))
                })
                .build(),
        )
        .plugin(tauri_plugin_single_instance::init(|app, _, _| {
            show_main_window(app);
        }))
        .plugin(
            tauri_plugin_autostart::Builder::new()
                .app_name("Ntfy")
                .build(),
        )
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(commands::handler())
        .on_window_event(setup_window_events)
        .setup(|app| {
            app.manage(db::init(app.handle())?);
            app.manage(ntfy::service::ServiceState::new()?);

            storage::legacy::clear_browser_profile(app.handle())?;
            tray::system::setup_tray(app)?;

            let handle = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let state = handle.state::<ntfy::service::ServiceState>();

                let _gate = state.gate.lock().await;

                if ntfy::service::start(&handle).await.is_err() {
                    eprintln!("Cannot start the native notification service");
                }

                if db::run(handle.state::<db::DbState>(), |connection| {
                    db::repo::cleanup_logs(connection, 30, 1000)
                })
                .await
                .is_err()
                {
                    eprintln!("Cannot apply automation log retention");
                }
            });

            let maintenance = app.handle().clone();

            tauri::async_runtime::spawn(async move {
                let mut interval = tokio::time::interval(std::time::Duration::from_secs(15 * 60));

                interval.tick().await;

                loop {
                    interval.tick().await;
                    if let Err(error) = db::run(maintenance.state::<db::DbState>(), |connection| {
                        db::repo::cleanup_logs(connection, 30, 1000)?;
                        db::repo::ntfy::cleanup(connection)
                    })
                    .await
                    {
                        eprintln!("Database retention failed: {error}");
                    }
                }
            });
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("Error while building application");
}
