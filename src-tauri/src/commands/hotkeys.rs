use tauri::{AppHandle, Emitter, Manager};

use crate::db::{DbState, models::HotkeySettings, repo, run};

#[tauri::command]
pub async fn get_hotkeys(app: AppHandle) -> Result<HotkeySettings, String> {
    run(app.state::<DbState>(), repo::hotkeys::get_hotkeys).await
}

#[tauri::command]
pub async fn update_hotkeys(
    app: AppHandle,
    input: HotkeySettings,
) -> Result<HotkeySettings, String> {
    let settings = run(app.state::<DbState>(), move |connection| {
        repo::hotkeys::update_hotkeys(connection, input)
    })
    .await?;

    let _ = app.emit("ntfy:hotkeys-changed", &settings);
    Ok(settings)
}
