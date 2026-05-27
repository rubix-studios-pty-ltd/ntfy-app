use std::path::Path;
use std::sync::{Arc, Mutex};

use rusqlite::Connection;
use tauri::Manager;

mod migrations;
pub mod models;
pub mod repo;

#[derive(Clone)]
pub struct DbState {
    pub conn: Arc<Mutex<Connection>>,
}

pub fn init(app_handle: &tauri::AppHandle) -> Result<DbState, String> {
    let db_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|error| error.to_string())?;

    std::fs::create_dir_all(&db_dir).map_err(|error| error.to_string())?;

    let path = db_dir.join("automation.sqlite");
    let connection = open_connection(&path)?;

    migrations::run(&connection).map_err(|error| error.to_string())?;

    Ok(DbState {
        conn: Arc::new(Mutex::new(connection)),
    })
}

pub async fn run<T, F>(state: tauri::State<'_, DbState>, f: F) -> Result<T, String>
where
    T: Send + 'static,
    F: FnOnce(&Connection) -> Result<T, String> + Send + 'static,
{
    let conn = state.conn.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let guard = conn
            .lock()
            .map_err(|_| "database lock poisoned".to_string())?;
        f(&guard)
    })
    .await
    .map_err(|err| err.to_string())?
}

pub fn open_connection(path: &Path) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(|error| error.to_string())?;

    connection
        .busy_timeout(std::time::Duration::from_secs(5))
        .map_err(|error| error.to_string())?;

    connection
        .execute_batch("PRAGMA foreign_keys = ON;")
        .map_err(|error| error.to_string())?;

    Ok(connection)
}
