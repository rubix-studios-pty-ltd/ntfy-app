use rusqlite::{Connection, params};
use std::{fs, path::Path, time::Duration};
use zeroize::Zeroizing;

use super::super::db;

pub fn open(path: &Path, key: &str) -> Result<Connection, String> {
    let connection = Connection::open(path).map_err(|error| error.to_string())?;

    connection
        .execute_batch("PRAGMA cipher_log_level = NONE;")
        .map_err(|error| error.to_string())?;

    let raw_key = Zeroizing::new(format!("x'{key}'"));

    connection
        .pragma_update(None, "key", raw_key.as_str())
        .map_err(|_| "Cannot key the database".to_string())?;

    let version: String = connection
        .query_row("PRAGMA cipher_version", [], |row| row.get(0))
        .map_err(|_| {
            "SQLCipher is unavailable. Refusing to open an unencrypted database.".to_string()
        })?;

    if version.is_empty() {
        return Err("SQLCipher encryption could not be verified".to_string());
    }

    connection
        .query_row("SELECT count(*) FROM sqlite_master", [], |row| {
            row.get::<_, i64>(0)
        })
        .map_err(|_| {
            "Cannot decrypt the database with the saved operating system key".to_string()
        })?;

    connection
        .busy_timeout(Duration::from_secs(5))
        .map_err(|error| error.to_string())?;

    connection.execute_batch("PRAGMA foreign_keys = ON; PRAGMA cipher_memory_security = ON; PRAGMA temp_store = MEMORY; PRAGMA secure_delete = ON; PRAGMA synchronous = FULL;")
        .map_err(|error| error.to_string())?;

    Ok(connection)
}

pub fn configure_runtime(connection: &Connection) -> Result<(), String> {
    let mode: String = connection
        .query_row("PRAGMA journal_mode = WAL", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if !mode.eq_ignore_ascii_case("wal") {
        return Err("Cannot enable the encrypted database's WAL journal".to_string());
    }

    connection
        .execute_batch("PRAGMA synchronous = NORMAL;")
        .map_err(|error| error.to_string())
}

pub fn migrate_plaintext(
    source: &Path,
    pending: &Path,
    destination: &Path,
    key: &str,
) -> Result<(), String> {
    if pending.exists() {
        fs::remove_file(pending).map_err(|error| error.to_string())?;
    }

    let connection = Connection::open(source).map_err(|error| error.to_string())?;

    connection
        .busy_timeout(Duration::from_secs(5))
        .map_err(|error| error.to_string())?;

    connection
        .execute_batch("PRAGMA wal_checkpoint(TRUNCATE); PRAGMA journal_mode = DELETE;")
        .map_err(|error| error.to_string())?;

    let raw_key = Zeroizing::new(format!("x'{key}'"));

    connection
        .execute(
            "ATTACH DATABASE ?1 AS encrypted KEY ?2",
            params![pending.to_string_lossy(), raw_key.as_str()],
        )
        .map_err(|error| error.to_string())?;

    connection
        .execute_batch("SELECT sqlcipher_export('encrypted'); DETACH DATABASE encrypted;")
        .map_err(|error| error.to_string())?;

    drop(connection);

    let encrypted = open(pending, key)?;

    db::migrations::run(&encrypted).map_err(|error| error.to_string())?;

    encrypted
        .execute(
            "INSERT OR REPLACE INTO app_meta(key, value) VALUES('legacy_database_imported', '1')",
            [],
        )
        .map_err(|error| error.to_string())?;

    let integrity: String = encrypted
        .query_row("PRAGMA integrity_check", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if integrity != "ok" {
        return Err(
            "The encrypted migration failed its integrity check. The original database is intact."
                .to_string(),
        );
    }
    drop(encrypted);

    fs::File::open(pending)
        .and_then(|file| file.sync_all())
        .map_err(|error| error.to_string())?;

    fs::rename(pending, destination).map_err(|error| error.to_string())?;

    #[cfg(unix)]
    if let Some(parent) = destination.parent() {
        fs::File::open(parent)
            .and_then(|file| file.sync_all())
            .map_err(|error| error.to_string())?;
    }
    Ok(())
}
