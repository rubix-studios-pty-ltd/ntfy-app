use std::ptr::null_mut;

use windows::Win32::{
    Media::Audio::{
        Endpoints::IAudioEndpointVolume, IMMDeviceEnumerator, MMDeviceEnumerator, eConsole, eRender,
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
            CoCreateInstance(&MMDeviceEnumerator, None, CLSCTX_ALL)
                .map_err(|error| format!("Failed to create audio device enumerator: {error}"))?;

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
            .SetMasterVolumeLevelScalar(scalar, null_mut())
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
            .SetMasterVolumeLevelScalar(next, null_mut())
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
            .SetMasterVolumeLevelScalar(next, null_mut())
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
            .SetMute(!muted, null_mut())
            .map_err(|error| format!("Failed to toggle mute: {error}"))
    })
}
