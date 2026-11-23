use ksni::TrayMethods;
use std::sync::LazyLock;

use crate::autostart::{is_autostart_enabled, toggle_autostart};
use crate::tray::{check_updates, exit_app};
use crate::windows::automation::open_automation_window;
use crate::windows::hotkeys::open_hotkeys_window;
use crate::windows::logs::open_logs_window;
use crate::windows::main::{toggle_main_window, window_tray_label};
use crate::windows::schedule::open_schedule_window;
use crate::windows::webhook::open_webhook_window;

pub struct NtfyTray {
    app: tauri::AppHandle,
    startup_enabled: bool,
}

static TRAY_ICONS: LazyLock<Vec<ksni::Icon>> = LazyLock::new(|| {
    [
        include_bytes!("../../../assets/ntfy-16x16.png").as_slice(),
        include_bytes!("../../../assets/ntfy-32x32.png").as_slice(),
        include_bytes!("../../../assets/ntfy-64x64.png").as_slice(),
    ]
    .into_iter()
    .map(|bytes| {
        let image = tauri::image::Image::from_bytes(bytes).expect("Valid tray icon PNG");

        let data = image
            .rgba()
            .chunks_exact(4)
            .flat_map(|rgba| [rgba[3], rgba[0], rgba[1], rgba[2]])
            .collect();

        ksni::Icon {
            width: image.width() as i32,
            height: image.height() as i32,
            data,
        }
    })
    .collect()
});

pub fn sync_tray_label(_app: &tauri::AppHandle) {}

impl ksni::Tray for NtfyTray {
    fn id(&self) -> String {
        "ntfy_app".to_string()
    }

    fn title(&self) -> String {
        "ntfy".to_string()
    }

    fn icon_name(&self) -> String {
        String::new()
    }

    fn icon_pixmap(&self) -> Vec<ksni::Icon> {
        TRAY_ICONS.clone()
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
                            if let Err(error) = toggle_autostart(&tray.app) {
                                eprintln!("Failed to toggle autostart: {error}");
                                return;
                            }

                            tray.startup_enabled = is_autostart_enabled(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem::<Self> {
                        label: "Schedule".into(),
                        activate: Box::new(|tray: &mut Self| {
                            open_schedule_window(&tray.app);
                        }),
                        ..Default::default()
                    }
                    .into(),
                    StandardItem::<Self> {
                        label: "Hotkeys".into(),
                        activate: Box::new(|tray: &mut Self| {
                            open_hotkeys_window(&tray.app);
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
                    let app = tray.app.clone();

                    std::thread::spawn(move || {
                        exit_app(&app);
                    });
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
        startup_enabled: is_autostart_enabled(app.handle()),
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
