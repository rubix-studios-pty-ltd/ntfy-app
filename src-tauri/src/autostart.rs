use std::io;

use tauri::AppHandle;
use tauri_plugin_autostart::ManagerExt;

pub fn is_autostart_enabled(app: &AppHandle) -> bool {
    app.autolaunch().is_enabled().unwrap_or(false)
}

pub fn enable_autostart(app: &AppHandle) -> io::Result<()> {
    app.autolaunch()
        .enable()
        .map_err(|error| io::Error::other(error.to_string()))
}

pub fn disable_autostart(app: &AppHandle) -> io::Result<()> {
    app.autolaunch()
        .disable()
        .map_err(|error| io::Error::other(error.to_string()))
}

pub fn toggle_autostart(app: &AppHandle) -> io::Result<bool> {
    if is_autostart_enabled(app) {
        disable_autostart(app)?;
        Ok(false)
    } else {
        enable_autostart(app)?;
        Ok(true)
    }
}
