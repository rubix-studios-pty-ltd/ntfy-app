use auto_launch::AutoLaunchBuilder;
use std::io;

const APP_NAME: &str = "Ntfy";

fn autolaunch() -> auto_launch::AutoLaunch {
    let exe = std::env::current_exe().expect("Failed to get current executable");

    AutoLaunchBuilder::new()
        .set_app_name(APP_NAME)
        .set_app_path(exe.to_string_lossy().as_ref())
        .build()
        .unwrap()
}

pub fn is_autostart_enabled() -> bool {
    autolaunch().is_enabled().unwrap_or(false)
}

pub fn enable_autostart() -> io::Result<()> {
    autolaunch().enable().map_err(io::Error::other)
}

pub fn disable_autostart() -> io::Result<()> {
    autolaunch().disable().map_err(io::Error::other)
}

pub fn toggle_autostart() -> io::Result<bool> {
    if is_autostart_enabled() {
        disable_autostart()?;
        Ok(false)
    } else {
        enable_autostart()?;
        Ok(true)
    }
}
