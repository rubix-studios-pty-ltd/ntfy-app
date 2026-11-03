use rusqlite::{Connection, params};
use tauri::Manager;

pub fn import_settings(app: &tauri::AppHandle, connection: &Connection) -> Result<(), String> {
    let path = app
        .path()
        .app_config_dir()
        .map_err(|error| error.to_string())?
        .join("ntfy-config.json");

    if !path.exists() {
        return Ok(());
    }

    let content = std::fs::read_to_string(&path).map_err(|error| error.to_string())?;

    let config: serde_json::Value =
        serde_json::from_str(&content).map_err(|error| error.to_string())?;

    if let Some(url) = config.get("instance_url").and_then(|value| value.as_str())
        && let Ok(url) = crate::ntfy::http::validate_server(url)
    {
        connection.execute("INSERT OR IGNORE INTO ntfy_servers(id, name, url, auth_kind, username, secret, enabled) VALUES('legacy', 'Previous server', ?1, 'none', '', '', 0)", params![url])
                .map_err(|error| error.to_string())?;
    }

    std::fs::remove_file(path).map_err(|error| error.to_string())
}

pub fn clear_browser_profile(app: &tauri::AppHandle) -> Result<(), String> {
    let state = app.state::<crate::db::DbState>();

    let connection = state
        .conn
        .lock()
        .map_err(|_| "Database lock poisoned".to_string())?;

    if crate::db::repo::ntfy::meta(&connection, "legacy_browser_cleared")?.is_some() {
        return Ok(());
    }

    let window =
        tauri::WebviewWindowBuilder::new(app, "legacy-cleanup", tauri::WebviewUrl::App("/".into()))
            .visible(false)
            .incognito(false)
            .build()
            .map_err(|_| "Cannot open the legacy browser profile for cleanup".to_string())?;

    let result = window.clear_all_browsing_data();

    let _ = window.destroy();

    result
        .map_err(|_| "Cannot clear the legacy web session. Restart Ntfy to retry.".to_string())?;

    connection
        .execute(
            "INSERT INTO app_meta(key,value) VALUES('legacy_browser_cleared','1')",
            [],
        )
        .map_err(|error| error.to_string())?;

    Ok(())
}
