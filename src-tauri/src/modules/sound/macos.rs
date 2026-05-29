use volumecontrol::AudioDevice;

fn device() -> Result<AudioDevice, String> {
    AudioDevice::from_default()
        .map_err(|error| format!("Failed to get default audio device: {error}"))
}

fn percent(value: f64) -> u8 {
    value.clamp(0.0, 100.0).round() as u8
}

pub fn set_volume(volume: f64) -> Result<(), String> {
    device()?
        .set_vol(percent(volume))
        .map_err(|error| format!("Failed to set volume: {error}"))
}

pub fn increase_volume(amount: f64) -> Result<(), String> {
    let device = device()?;

    let current = device
        .get_vol()
        .map_err(|error| format!("Failed to read volume: {error}"))?;

    let next = current.saturating_add(percent(amount)).min(100);

    device
        .set_vol(next)
        .map_err(|error| format!("Failed to increase volume: {error}"))
}

pub fn decrease_volume(amount: f64) -> Result<(), String> {
    let device = device()?;

    let current = device
        .get_vol()
        .map_err(|error| format!("Failed to read volume: {error}"))?;

    let next = current.saturating_sub(percent(amount));

    device
        .set_vol(next)
        .map_err(|error| format!("Failed to decrease volume: {error}"))
}

pub fn toggle_mute() -> Result<(), String> {
    let device = device()?;

    let muted = device
        .is_mute()
        .map_err(|error| format!("Failed to read mute state: {error}"))?;

    device
        .set_mute(!muted)
        .map_err(|error| format!("Failed to toggle mute: {error}"))
}
