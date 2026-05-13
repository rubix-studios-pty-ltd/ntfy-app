use tauri::{
    Manager,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Url,
};
use tauri_plugin_updater::UpdaterExt;

use crate::autostart::toggle_autostart;

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let show = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;

    let autostart_enabled = crate::autostart::is_autostart_enabled();

    let check_updates =
        MenuItem::with_id(app, "check_updates", "Check Updates", true, None::<&str>)?;

    let autostart = CheckMenuItem::with_id(
        app,
        "autostart",
        "Auto Start",
        true,
        autostart_enabled,
        None::<&str>,
    )?;

    let reset_instance =
        MenuItem::with_id(app, "reset_instance", "Reset Instance", true, None::<&str>)?;

    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::new(app)?;
    menu.append(&show)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&autostart)?;
    menu.append(&check_updates)?;
    menu.append(&reset_instance)?;
    menu.append(&PredefinedMenuItem::separator(app)?)?;
    menu.append(&quit)?;

    let icon = app.default_window_icon().cloned();

    let _tray = TrayIconBuilder::new()
        .icon(icon.unwrap())
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "autostart" => {
                if let Err(error) = toggle_autostart() {
                    eprintln!("Failed to toggle autostart: {error}");
                } else if let Some(item) = app.menu().and_then(|m| m.get("autostart")) {
                    if let Some(check_item) = item.as_check_menuitem() {
                        let enabled = crate::autostart::is_autostart_enabled();

                        let _ = check_item.set_checked(enabled);
                    }
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
                if let Err(error) = crate::config::clear_instance_url(app.app_handle()) {
                    eprintln!("Failed to reset instance URL: {error}");
                }

                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.clear_all_browsing_data();

                    let app_url = app
                        .config()
                        .build
                        .dev_url
                        .as_ref()
                        .map(|url| url.to_string())
                        .unwrap_or_else(|| "tauri://localhost/".to_string());

                    let _ = window.navigate(Url::parse(&app_url).unwrap());
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "quit" => {
                std::process::exit(0);
            }

            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::DoubleClick {
                button: MouseButton::Left,
                ..
            } = event
            {
                if let Some(window) = tray.app_handle().get_webview_window("main") {
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
            }
        })
        .build(app)?;

    Ok(())
}
