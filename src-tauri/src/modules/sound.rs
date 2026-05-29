use serde_json::Value;

use crate::automation::matcher::MatchContext;
use crate::automation::modules::{FieldKind, ModuleField};
use crate::db::models::AutomationRule;

const SET_VOLUME: &[ModuleField] = &[ModuleField {
    key: "volume",
    kind: FieldKind::Number,
    min: Some(0.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const INCREASE_VOLUME: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const DECREASE_VOLUME: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const TOGGLE_MUTE: &[ModuleField] = &[];

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "setVolume" => Some(SET_VOLUME),
        "increaseVolume" => Some(INCREASE_VOLUME),
        "decreaseVolume" => Some(DECREASE_VOLUME),
        "toggleMute" => Some(TOGGLE_MUTE),
        _ => None,
    }
}

pub fn execute(
    module_id: &str,
    rule: &AutomationRule,
    context: &MatchContext,
) -> Result<(), String> {
    match module_id {
        "setVolume" => {
            let volume = number_config(rule, "volume", context)?;
            self::system_volume::set_volume(volume)
        }
        "increaseVolume" => {
            let amount = number_config(rule, "amount", context)?;
            self::system_volume::increase_volume(amount)
        }
        "decreaseVolume" => {
            let amount = number_config(rule, "amount", context)?;
            self::system_volume::decrease_volume(amount)
        }
        "toggleMute" => self::system_volume::toggle_mute(),

        _ => Err(format!("Unknown sound module: {module_id}")),
    }
}

fn number_config(rule: &AutomationRule, key: &str, context: &MatchContext) -> Result<f64, String> {
    let config = rule
        .action_config
        .as_ref()
        .ok_or_else(|| "Module config is required".to_string())?;

    let value = config
        .get(key)
        .ok_or_else(|| format!("Module config is missing {key}"))?;

    let number = match value {
        Value::Number(number) => number
            .as_f64()
            .ok_or_else(|| format!("{key} must be a valid number"))?,

        Value::String(text) => replace_tokens(text, context)
            .trim()
            .parse::<f64>()
            .map_err(|_| format!("{key} must be a number"))?,

        _ => return Err(format!("{key} must be a number")),
    };

    if !number.is_finite() {
        return Err(format!("{key} must be finite"));
    }

    Ok(number)
}

fn replace_tokens(value: &str, context: &MatchContext) -> String {
    value
        .replace("$value", &context.value)
        .replace("$message", &context.message)
        .replace("$matchedLine", &context.matched_line)
}

#[cfg(target_os = "windows")]
mod system_volume {
    use std::ptr::null;

    use windows::Win32::{
        Media::Audio::{
            Endpoints::IAudioEndpointVolume, IMMDeviceEnumerator, MMDeviceEnumerator, eConsole,
            eRender,
        },
        System::Com::{
            CLSCTX_ALL, COINIT_MULTITHREADED, CoCreateInstance, CoInitializeEx, CoUninitialize,
        },
    };

    struct ComGuard;

    impl ComGuard {
        fn new() -> Result<Self, String> {
            unsafe {
                CoInitializeEx(None, COINIT_MULTITHREADED)
                    .ok()
                    .map_err(|error| format!("Failed to initialise COM: {error}"))?;
            }

            Ok(Self)
        }
    }

    impl Drop for ComGuard {
        fn drop(&mut self) {
            unsafe {
                CoUninitialize();
            }
        }
    }

    fn with_endpoint<T>(
        callback: impl FnOnce(&IAudioEndpointVolume) -> Result<T, String>,
    ) -> Result<T, String> {
        let _com = ComGuard::new()?;

        let endpoint = unsafe {
            let enumerator: IMMDeviceEnumerator =
                CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL).map_err(|error| {
                    format!("Failed to create audio device enumerator: {error}")
                })?;

            let device = enumerator
                .GetDefaultAudioEndpoint(eRender, eConsole)
                .map_err(|error| format!("Failed to get default audio endpoint: {error}"))?;

            device
                .Activate::<IAudioEndpointVolume>(CLSCTX_ALL, None)
                .map_err(|error| format!("Failed to activate audio endpoint volume: {error}"))?
        };

        callback(&endpoint)
    }

    pub fn set_volume(volume: f64) -> Result<(), String> {
        let scalar = (volume.clamp(0.0, 100.0) / 100.0) as f32;

        with_endpoint(|endpoint| unsafe {
            endpoint
                .SetMasterVolumeLevelScalar(scalar, null())
                .map_err(|error| format!("Failed to set volume: {error}"))
        })
    }

    pub fn increase_volume(amount: f64) -> Result<(), String> {
        let amount = (amount.clamp(0.0, 100.0) / 100.0) as f32;

        with_endpoint(|endpoint| unsafe {
            let current = endpoint
                .GetMasterVolumeLevelScalar()
                .map_err(|error| format!("Failed to read volume: {error}"))?;

            let next = (current + amount).clamp(0.0, 1.0);

            endpoint
                .SetMasterVolumeLevelScalar(next, null())
                .map_err(|error| format!("Failed to increase volume: {error}"))
        })
    }

    pub fn decrease_volume(amount: f64) -> Result<(), String> {
        let amount = (amount.clamp(0.0, 100.0) / 100.0) as f32;

        with_endpoint(|endpoint| unsafe {
            let current = endpoint
                .GetMasterVolumeLevelScalar()
                .map_err(|error| format!("Failed to read volume: {error}"))?;

            let next = (current - amount).clamp(0.0, 1.0);

            endpoint
                .SetMasterVolumeLevelScalar(next, null())
                .map_err(|error| format!("Failed to decrease volume: {error}"))
        })
    }

    pub fn toggle_mute() -> Result<(), String> {
        with_endpoint(|endpoint| unsafe {
            let muted = endpoint
                .GetMute()
                .map_err(|error| format!("Failed to read mute state: {error}"))?
                .as_bool();

            endpoint
                .SetMute(!muted, null())
                .map_err(|error| format!("Failed to toggle mute: {error}"))
        })
    }
}

#[cfg(not(target_os = "windows"))]
mod system_volume {
    pub fn set_volume(_volume: f64) -> Result<(), String> {
        Err("Volume control is only supported on Windows".to_string())
    }

    pub fn increase_volume(_amount: f64) -> Result<(), String> {
        Err("Volume control is only supported on Windows".to_string())
    }

    pub fn decrease_volume(_amount: f64) -> Result<(), String> {
        Err("Volume control is only supported on Windows".to_string())
    }

    pub fn toggle_mute() -> Result<(), String> {
        Err("Volume control is only supported on Windows".to_string())
    }
}
