use ksni::TrayMethods;

use crate::autostart::{is_autostart_enabled, toggle_autostart};
use crate::tray::{check_updates, exit_app, reset_instance};
use crate::windows::automation::open_automation_window;
use crate::windows::config::open_config_window;
use crate::windows::logs::open_logs_window;
use crate::windows::main::{toggle_main_window, window_tray_label};
use crate::windows::webhook::open_webhook_window;

pub struct NtfyTray {
    app: tauri::AppHandle,
    startup_enabled: bool,
}

pub fn sync_tray_label(_app: &tauri::AppHandle) {}

impl ksni::Tray for NtfyTray {
    fn id(&self) -> String {
        "ntfy_app".to_string()
    }

    fn title(&self) -> String {
        "ntfy".to_string()
    }

    fn icon_name(&self) -> String {
        "ntfy_app".to_string()
    }

    fn category(&self) -> ksni::Category {
        ksni::Category::ApplicationStatus
    }

    fn activate(&mut self, _x: i32, _y: i32) {
        toggle_main_window(&self.app);
        sync_tray_label(&self.app);
    }

    fn menu(&self) -> Vec<ksni::MenuItem<Self>> {
        use ksni::menu::*;

        vec![
            StandardItem::<Self> {
                label: window_tray_label(&self.app).into(),
                activate: Box::new(|tray: &mut Self| {
                    toggle_main_window(&tray.app);
                    sync_tray_label(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            MenuItem::Separator,
            StandardItem::<Self> {
                label: "Automation".into(),
                activate: Box::new(|tray: &mut Self| {
                    open_automation_window(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            StandardItem::<Self> {
                label: "Webhook".into(),
                activate: Box::new(|tray: &mut Self| {
                    open_webhook_window(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            SubMenu::<Self> {
                label: "Settings".into(),
                submenu: vec![
                    CheckmarkItem::<Self> {
                        label: "Startup".into(),
                        checked: self.startup_enabled,
                        activate: Box::new(|tray: &mut Self| {
                            if let Err(error) = toggle_autostart() {
                                eprintln!("Failed to toggle autostart: {error}");
                                return;
                            }
            
                            tray.startup_enabled = is_autostart_enabled();
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem::<Self> {
                        label: "Config".into(),
                        activate: Box::new(|tray: &mut Self| {
                            open_config_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem::<Self> {
                        label: "Logs".into(),
                        activate: Box::new(|tray: &mut Self| {
                            open_logs_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem::<Self> {
                        label: "Reset".into(),
                        activate: Box::new(|tray: &mut Self| {
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
            StandardItem::<Self> {
                label: "Update".into(),
                activate: Box::new(|tray: &mut Self| {
                    check_updates(&tray.app);
                }),
                ..Default::default()
            }
            .into(),
            StandardItem::<Self> {
                label: "Exit".into(),
                activate: Box::new(|tray: &mut Self| {
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
        startup_enabled: is_autostart_enabled(),
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