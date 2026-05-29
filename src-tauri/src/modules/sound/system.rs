#[cfg(target_os = "windows")]
#[path = "windows.rs"]
mod platform;

#[cfg(target_os = "macos")]
#[path = "macos.rs"]
mod platform;

#[cfg(target_os = "linux")]
#[path = "linux.rs"]
mod platform;

#[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
mod platform {
    pub fn set_volume(_volume: f64) -> Result<(), String> {
        Err("Volume control is not supported on this platform".to_string())
    }

    pub fn increase_volume(_amount: f64) -> Result<(), String> {
        Err("Volume control is not supported on this platform".to_string())
    }

    pub fn decrease_volume(_amount: f64) -> Result<(), String> {
        Err("Volume control is not supported on this platform".to_string())
    }

    pub fn toggle_mute() -> Result<(), String> {
        Err("Volume control is not supported on this platform".to_string())
    }
}

pub use platform::{decrease_volume, increase_volume, set_volume, toggle_mute};
