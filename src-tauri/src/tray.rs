use tauri::{
    Manager,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
};

use tauri_plugin_updater::UpdaterExt;

use crate::autostart::is_autostart_enabled;
use crate::autostart::toggle_autostart;
use crate::config::clear_instance;
use crate::windows::automation::open_automation_window;
use crate::windows::webhook::open_webhook_window;

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, "open", "Open ntfy", true, None::<&str>)?;

    let automation = MenuItem::with_id(app, "automation", "Automation", true, None::<&str>)?;

    let webhook = MenuItem::with_id(app, "webhook", "Webhook builder", true, None::<&str>)?;

    let autostart_enabled = is_autostart_enabled();

    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        "Launch on startup",
        true,
        autostart_enabled,
        None::<&str>,
    )?;

    let reset_instance =
        MenuItem::with_id(app, "reset_instance", "Reset instance", true, None::<&str>)?;

    let check_updates = MenuItem::with_id(
        app,
        "check_updates",
        "Check for updates",
        true,
        None::<&str>,
    )?;

    let exit = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;

    let tools_menu =
        Submenu::with_id_and_items(app, "tools", "Tools", true, &[&automation, &webhook])?;

    let settings_menu = Submenu::with_id_and_items(
        app,
        "settings",
        "Settings",
        true,
        &[&autostart, &reset_instance],
    )?;

    let separator_1 = PredefinedMenuItem::separator(app)?;
    let separator_2 = PredefinedMenuItem::separator(app)?;

    let menu = Menu::with_items(
        app,
        &[
            &open,
            &separator_1,
            &tools_menu,
            &settings_menu,
            &separator_2,
            &check_updates,
            &exit,
        ],
    )?;

    let icon = app.default_window_icon().cloned();

    let _tray = TrayIconBuilder::new()
        .icon(icon.unwrap())
        .tooltip("Ntfy")
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "open" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
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
                std::process::exit(0);
            }

            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
                && let Some(window) = tray.app_handle().get_webview_window("main")
            {
                let is_visible = window.is_visible().unwrap_or(false);

                let is_minimized = window.is_minimized().unwrap_or(false);

                let visible = is_visible && !is_minimized;

                if visible {
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
