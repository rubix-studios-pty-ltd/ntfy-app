use tauri::AppHandle;

use crate::background;

#[tauri::command]
pub fn sync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    background::sync_websocket(&app_handle, &url)
}

#[tauri::command]
pub fn unsync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    background::unsync_websocket(&app_handle, &url)
}

#[tauri::command]
pub fn complete_websocket(app_handle: AppHandle, page_url: String) -> Result<bool, String> {
    background::complete_websocket(&app_handle, &page_url)
}
