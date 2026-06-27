use tauri::{
    Manager,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use tauri_plugin_updater::UpdaterExt;
use tauri_plugin_window_state::{AppHandleExt, StateFlags};

use crate::autostart::is_autostart_enabled;
use crate::autostart::toggle_autostart;
use crate::config::clear_instance;
use crate::windows::automation::open_automation_window;
use crate::windows::config::open_config_window;
use crate::windows::logs::open_logs_window;
use crate::windows::webhook::open_webhook_window;

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {    
    let version = app.package_info().version.to_string();
    let version_label = format!("ntfy {version}");
    let version_item = MenuItem::with_id(app, "version", version_label, false, None::<&str>)?;

    let open = MenuItem::with_id(app, "open", "Show/Hide", true, None::<&str>)?;
    let automation = MenuItem::with_id(app, "automation", "Automation", true, None::<&str>)?;
    let webhook = MenuItem::with_id(app, "webhook", "Webhook", true, None::<&str>)?;
    let logs = MenuItem::with_id(app, "logs", "Logs", true, None::<&str>)?;

    let autostart_enabled = is_autostart_enabled();
    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        "Startup",
        true,
        autostart_enabled,
        None::<&str>,
    )?;

    let config = MenuItem::with_id(app, "config", "Config", true, None::<&str>)?;
    let reset_instance = MenuItem::with_id(app, "reset_instance", "Reset", true, None::<&str>)?;
    let check_updates = MenuItem::with_id(app, "check_updates", "Update", true, None::<&str>)?;
    let exit = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;

    let separator = PredefinedMenuItem::separator(app)?;

    let tools_menu =
        Submenu::with_id_and_items(app, "tools", "Tools", true, &[&automation, &webhook])?;

    let settings_menu = Submenu::with_id_and_items(
        app,
        "settings",
        "Settings",
        true,
        &[&autostart, &config, &separator, &reset_instance],
    )?;

    let menu = Menu::with_items(
        app,
        &[
            &version_item,
            &open,
            &separator,
            &tools_menu,
            &settings_menu,
            &logs,
            &separator,
            &check_updates,
            &exit,
        ],
    )?;

    let icon = app.default_window_icon().cloned();

    let _tray = TrayIconBuilder::new()
        .icon(icon.unwrap())
        .tooltip("Ntfy")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    let is_minimized = window.is_minimized().unwrap_or(false);

                    if is_visible && !is_minimized {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
            }
            "automation" => {
                open_automation_window(app.app_handle());
            }
            "webhook" => {
                open_webhook_window(app.app_handle());
            }
            "autostart" => {
                if let Err(error) = toggle_autostart() {
                    eprintln!("Failed to toggle autostart: {error}");
                } else if let Some(item) = app.menu().and_then(|m| m.get("autostart"))
                    && let Some(check_item) = item.as_check_menuitem()
                {
                    let enabled = is_autostart_enabled();

                    let _ = check_item.set_checked(enabled);
                }
            }
            "config" => {
                open_config_window(app.app_handle());
            }
            "logs" => {
                open_logs_window(app.app_handle());
            }
            "check_updates" => {
                let handle = app.app_handle().clone();

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
            "reset_instance" => {
                if let Err(error) = clear_instance(app.app_handle()) {
                    eprintln!("Failed to reset instance URL: {error}");
                }

                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.clear_all_browsing_data();
                }

                app.restart();
            }
            "exit" => {
                let _ = app
                .app_handle()
                .save_window_state(StateFlags::SIZE | StateFlags::POSITION);

                std::process::exit(0);
            }

            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
                && let Some(window) = tray.app_handle().get_webview_window("main")
            {
                let is_visible = window.is_visible().unwrap_or(false);
                let is_minimized = window.is_minimized().unwrap_or(false);
        
                if is_visible && !is_minimized {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
        })
        .build(app)?;

    Ok(())
}
