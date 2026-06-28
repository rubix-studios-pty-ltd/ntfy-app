use ksni::TrayMethods;
use tauri::Manager;

use crate::autostart::{is_autostart_enabled, toggle_autostart};
use crate::tray::{check_updates, exit_app, reset_instance, window_tray_label};
use crate::windows::automation::open_automation_window;
use crate::windows::config::open_config_window;
use crate::windows::logs::open_logs_window;
use crate::windows::main::toggle_main_window;
use crate::windows::webhook::open_webhook_window;

pub struct NtfyTray {
    app: tauri::AppHandle,
    version: String,
}

impl ksni::Tray for NtfyTray {
    fn id(&self) -> String {
        "ntfy".to_string()
    }

    fn title(&self) -> String {
        "ntfy".to_string()
    }

    fn icon_name(&self) -> String {
        "ntfy".to_string()
    }

    fn category(&self) -> ksni::Category {
        ksni::Category::ApplicationStatus
    }

    fn activate(&mut self, _x: i32, _y: i32) {
        toggle_main_window(&self.app);
    }

    fn menu(&self) -> Vec<ksni::MenuItem<Self>> {
        use ksni::menu::*;

        vec![
            StandardItem {
                label: format!("ntfy {}", self.version).into(),
                enabled: false,
                ..Default::default()
            }
            .into(),
            StandardItem {
                label: window_tray_label(&self.app).into(),
                activate: Box::new(|tray| {
                    toggle_main_window(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            MenuItem::Separator,

            SubMenu {
                label: "Tools".into(),
                submenu: vec![
                    StandardItem {
                        label: "Automation".into(),
                        activate: Box::new(|tray| {
                            open_automation_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem {
                        label: "Webhook".into(),
                        activate: Box::new(|tray| {
                            open_webhook_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem {
                        label: "Logs".into(),
                        activate: Box::new(|tray| {
                            open_logs_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                ],
                ..Default::default()
            }
            .into(),

            SubMenu {
                label: "Settings".into(),
                submenu: vec![
                    CheckmarkItem {
                        label: "Startup".into(),
                        checked: is_autostart_enabled(),
                        activate: Box::new(|_| {
                            if let Err(error) = toggle_autostart() {
                                eprintln!("Failed to toggle autostart: {error}");
                            }
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem {
                        label: "Config".into(),
                        activate: Box::new(|tray| {
                            open_config_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    MenuItem::Separator,
                    StandardItem {
                        label: "Reset".into(),
                        activate: Box::new(|tray| {
                            reset_instance(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                ],
                ..Default::default()
            }
            .into(),
            MenuItem::Separator,

            StandardItem {
                label: "Update".into(),
                activate: Box::new(|tray| {
                    check_updates(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            StandardItem {
                label: "Exit".into(),
                activate: Box::new(|tray| {
                    exit_app(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
        ]
    }
}

pub fn setup_tray(app: &tauri::App) -> tauri::Result<()> {
    let tray = NtfyTray {
        app: app.handle().clone(),
        version: app.package_info().version.to_string(),
    };

    match tauri::async_runtime::block_on(tray.disable_dbus_name(true).spawn()) {
        Ok(handle) => {
            Box::leak(Box::new(handle));
        }

        Err(error) => {
            eprintln!("Failed to spawn Linux ksni tray: {error}");
        }
    }

    Ok(())
}