use std::process::Command;

use volumecontrol::AudioDevice;

fn percent(value: f64) -> u8 {
    value.clamp(0.0, 100.0).round() as u8
}

fn percent_arg(value: f64) -> String {
    format!("{}%", percent(value))
}

fn device() -> Result<AudioDevice, String> {
    AudioDevice::from_default()
        .map_err(|error| format!("Failed to get default audio device: {error}"))
}

fn run_command(program: &str, args: Vec<String>) -> Result<(), String> {
    let output = Command::new(program)
        .args(&args)
        .output()
        .map_err(|error| format!("Failed to run {program}: {error}"))?;

    if output.status.success() {
        return Ok(());
    }

    let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();

    if stderr.is_empty() {
        Err(format!("{program} failed with status {}", output.status))
    } else {
        Err(format!("{program} failed: {stderr}"))
    }
}

fn run_fallbacks(
    initial_error: String,
    commands: Vec<(&'static str, Vec<String>)>,
) -> Result<(), String> {
    let mut errors = vec![format!("volumecontrol failed: {initial_error}")];

    for (program, args) in commands {
        match run_command(program, args) {
            Ok(()) => return Ok(()),
            Err(error) => errors.push(error),
        }
    }

    Err(format!(
        "No Linux volume backend worked: {}",
        errors.join(" | ")
    ))
}

fn try_with_fallbacks(
    backend: impl FnOnce() -> Result<(), String>,
    commands: Vec<(&'static str, Vec<String>)>,
) -> Result<(), String> {
    match backend() {
        Ok(()) => Ok(()),
        Err(error) => run_fallbacks(error, commands),
    }
}

fn linux_set_volume(volume: f64) -> Result<(), String> {
    device()?
        .set_vol(percent(volume))
        .map_err(|error| format!("Failed to set volume: {error}"))
}

fn linux_increase_volume(amount: f64) -> Result<(), String> {
    let device = device()?;

    let current = device
        .get_vol()
        .map_err(|error| format!("Failed to read volume: {error}"))?;

    let next = current.saturating_add(percent(amount)).min(100);

    device
        .set_vol(next)
        .map_err(|error| format!("Failed to increase volume: {error}"))
}

fn linux_decrease_volume(amount: f64) -> Result<(), String> {
    let device = device()?;

    let current = device
        .get_vol()
        .map_err(|error| format!("Failed to read volume: {error}"))?;

    let next = current.saturating_sub(percent(amount));

    device
        .set_vol(next)
        .map_err(|error| format!("Failed to decrease volume: {error}"))
}

fn linux_toggle_mute() -> Result<(), String> {
    let device = device()?;

    let muted = device
        .is_mute()
        .map_err(|error| format!("Failed to read mute state: {error}"))?;

    device
        .set_mute(!muted)
        .map_err(|error| format!("Failed to toggle mute: {error}"))
}

pub fn set_volume(volume: f64) -> Result<(), String> {
    let clamped_volume = volume.clamp(0.0, 100.0);
    let volume_arg = percent_arg(clamped_volume);

    try_with_fallbacks(
        || linux_set_volume(clamped_volume),
        vec![
            (
                "wpctl",
                vec![
                    "set-volume".into(),
                    "@DEFAULT_SINK@".into(),
                    volume_arg.clone(),
                    "--limit".into(),
                    "1.0".into(),
                ],
            ),
            (
                "pactl",
                vec![
                    "set-sink-volume".into(),
                    "@DEFAULT_SINK@".into(),
                    volume_arg,
                ],
            ),
        ],
    )
}

pub fn increase_volume(amount: f64) -> Result<(), String> {
    let amount = percent(amount);
    let wpctl_amount = format!("{amount}%+");
    let pactl_amount = format!("+{amount}%");

    try_with_fallbacks(
        || linux_increase_volume(amount as f64),
        vec![
            (
                "wpctl",
                vec![
                    "set-volume".into(),
                    "@DEFAULT_SINK@".into(),
                    wpctl_amount,
                    "--limit".into(),
                    "1.0".into(),
                ],
            ),
            (
                "pactl",
                vec![
                    "set-sink-volume".into(),
                    "@DEFAULT_SINK@".into(),
                    pactl_amount,
                ],
            ),
        ],
    )
}

pub fn decrease_volume(amount: f64) -> Result<(), String> {
    let amount = percent(amount);
    let wpctl_amount = format!("{amount}%-");
    let pactl_amount = format!("-{amount}%");

    try_with_fallbacks(
        || linux_decrease_volume(amount as f64),
        vec![
            (
                "wpctl",
                vec!["set-volume".into(), "@DEFAULT_SINK@".into(), wpctl_amount],
            ),
            (
                "pactl",
                vec![
                    "set-sink-volume".into(),
                    "@DEFAULT_SINK@".into(),
                    pactl_amount,
                ],
            ),
        ],
    )
}

pub fn toggle_mute() -> Result<(), String> {
    try_with_fallbacks(
        linux_toggle_mute,
        vec![
            (
                "wpctl",
                vec!["set-mute".into(), "@DEFAULT_SINK@".into(), "toggle".into()],
            ),
            (
                "pactl",
                vec![
                    "set-sink-mute".into(),
                    "@DEFAULT_SINK@".into(),
                    "toggle".into(),
                ],
            ),
        ],
    )
}
