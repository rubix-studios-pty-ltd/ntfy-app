pub use platform::setup_tray;

#[cfg(target_os = "linux")]
#[path = "linux.rs"]
mod platform;

#[cfg(not(target_os = "linux"))]
#[path = "native.rs"]
mod platform;

pub use platform::sync_tray_label;
