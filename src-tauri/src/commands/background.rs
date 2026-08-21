use tauri::AppHandle;

#[tauri::command]
pub fn sync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    crate::background::sync_websocket(&app_handle, &url)
}

#[tauri::command]
pub fn unsync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    crate::background::unsync_websocket(&app_handle, &url)
}

#[tauri::command]
pub fn complete_websocket(app_handle: AppHandle, page_url: String) -> Result<bool, String> {
    crate::background::complete_websocket(&app_handle, &page_url)
}
