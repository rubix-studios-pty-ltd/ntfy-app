use tauri::{
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

use crate::autostart::{is_autostart_enabled, toggle_autostart};
use crate::tray::{check_updates, exit_app, reset_instance};
use crate::windows::automation::open_automation_window;
use crate::windows::config::open_config_window;
use crate::windows::logs::open_logs_window;
use crate::windows::main::{toggle_main_window, window_tray_label};
use crate::windows::webhook::open_webhook_window;

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let version = app.package_info().version.to_string();
    let version_label = format!("ntfy {version}");
    let app_version = MenuItem::with_id(app, "version", version_label, false, None::<&str>)?;

    let window_status = window_tray_label(app.handle());
    let open = MenuItem::with_id(app, "open", window_status, true, None::<&str>)?;

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
    let reset_instance_item =
        MenuItem::with_id(app, "reset_instance", "Reset", true, None::<&str>)?;
    let updates = MenuItem::with_id(app, "check_updates", "Update", true, None::<&str>)?;
    let exit = MenuItem::with_id(app, "exit", "Exit", true, None::<&str>)?;

    let separator = PredefinedMenuItem::separator(app)?;

    let tools_menu =
        Submenu::with_id_and_items(app, "tools", "Tools", true, &[&automation, &webhook, &logs])?;

    let settings_menu = Submenu::with_id_and_items(
        app,
        "settings",
        "Settings",
        true,
        &[&autostart, &config, &separator, &reset_instance_item],
    )?;

    let menu = Menu::with_items(
        app,
        &[
            &app_version,
            &open,
            &separator,
            &tools_menu,
            &settings_menu,
            &separator,
            &updates,
            &exit,
        ],
    )?;

    let Some(icon) = app.default_window_icon().cloned() else {
        return Ok(());
    };

    let open_menu_item = open.clone();
    let open_tray_item = open.clone();

    let _tray = TrayIconBuilder::new()
        .icon(icon)
        .tooltip("Ntfy")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(move |app, event| {
            match event.id.as_ref() {
            "open" => {
                let label = toggle_main_window(app);
                let _ = open_menu_item.set_text(label);
            }

            "automation" => {
                open_automation_window(app);
            }

            "webhook" => {
                open_webhook_window(app);
            }

            "logs" => {
                open_logs_window(app);
            }

            "autostart" => {
                if let Err(error) = toggle_autostart() {
                    eprintln!("Failed to toggle autostart: {error}");
                } else if let Some(item) = app.menu().and_then(|menu| menu.get("autostart"))
                    && let Some(check_item) = item.as_check_menuitem()
                {
                    let enabled = is_autostart_enabled();
                    let _ = check_item.set_checked(enabled);
                }
            }

            "config" => {
                open_config_window(app);
            }

            "check_updates" => {
                check_updates(app);
            }

            "reset_instance" => {
                reset_instance(app);
            }

            "exit" => {
                exit_app(app);
            }

            _ => {}
        }
    })
    .on_tray_icon_event(move |tray, event| {
        if let TrayIconEvent::Click {
            button: MouseButton::Left,
            button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();

                let label = toggle_main_window(app);
                let _ = open_tray_item.set_text(label);
            }
        })
        .build(app)?;

    Ok(())
}