use rusqlite::Connection;
use std::sync::{Arc, Mutex};
use tauri::Manager;

pub(crate) mod migrations;
pub mod models;
pub mod repo;

#[derive(Clone)]
pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

pub fn init(app: &tauri::AppHandle) -> Result<DbState, String> {
    let directory = app
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&directory).map_err(|error| error.to_string())?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        std::fs::set_permissions(&directory, std::fs::Permissions::from_mode(0o700))
            .map_err(|error| error.to_string())?;
    }

    let path = directory.join("ntfy.sqlite");

    let pending = directory.join("ntfy.encrypted-pending.sqlite");

    let legacy = directory.join("automation.sqlite");

    let key = crate::storage::key::database_key(path.exists() || pending.exists())?;

    if !path.exists() && legacy.exists() {
        crate::storage::encryption::migrate_plaintext(&legacy, &pending, &path, &key)?;
    }

    let connection = crate::storage::encryption::open(&path, &key)?;

    migrations::run(&connection).map_err(|error| error.to_string())?;

    crate::storage::legacy::import_settings(app, &connection)?;

    let migrated: bool = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM app_meta WHERE key='legacy_database_imported')",
            [],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if migrated {
        for name in [
            "automation.sqlite",
            "automation.sqlite-wal",
            "automation.sqlite-shm",
            "automation.sqlite-journal",
        ] {
            let file = directory.join(name);
            if file.exists() {
                std::fs::remove_file(file).map_err(|error| error.to_string())?;
            }
        }
    }

    repo::ntfy::cleanup(&connection)?;

    Ok(DbState {
        conn: Arc::new(Mutex::new(connection)),
    })
}

pub async fn run<T, F>(state: tauri::State<'_, DbState>, f: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce(&Connection) -> Result<T, String> + Send + 'static,
{
    let connection = state.conn.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let guard = connection
            .lock()
            .map_err(|_| "Database lock poisoned".to_string())?;
        f(&guard)
    })
    .await
    .map_err(|error| error.to_string())?
}
