use crate::db::{DbState, repo::ntfy as repository, run};
use crate::ntfy::http;
use crate::ntfy::models::*;
use crate::ntfy::service::{self, ServiceState};

use rusqlite::params;
use tauri::{AppHandle, Emitter, Manager};
use zeroize::Zeroizing;

#[tauri::command]
pub async fn ntfy_snapshot(app: AppHandle) -> Result<Snapshot, String> {
    let (servers, topics) = run(app.state::<DbState>(), |connection| {
        let servers = repository::servers(connection)?;
        let topics = repository::topics(connection)?;

        Ok((servers, topics))
    })
    .await?;

    Ok(Snapshot {
        servers,
        topics,
        statuses: app.state::<ServiceState>().statuses(),
        encrypted: true,
    })
}

#[tauri::command]
pub async fn ntfy_save_server(app: AppHandle, mut input: ServerInput) -> Result<(), String> {
    let state = app.state::<ServiceState>();

    let _gate = state.gate.lock().await;

    input.name = input.name.trim().to_string();
    input.url = http::validate_server(&input.url)?;

    if input.name.is_empty() || input.name.len() > 100 {
        return Err("Server name must contain 1 to 100 characters".to_string());
    }

    if input.username.contains(':') || input.username.chars().any(char::is_control) {
        return Err("The username contains invalid characters".to_string());
    }

    if !matches!(input.auth_kind.as_str(), "none" | "basic" | "token") {
        return Err("Choose a valid authentication method".to_string());
    }

    let secret = if let Some(secret) = input.secret.as_ref() {
        Zeroizing::new(secret.clone())
    } else if let Some(id) = input.id.clone() {
        let existing = run(app.state::<DbState>(), move |connection| {
            repository::credentials(connection, &id)
        })
        .await?;

        if existing.auth_kind != input.auth_kind || existing.username != input.username {
            return Err(
                "Enter credentials for the new authentication method or username".to_string(),
            );
        }

        Zeroizing::new(existing.secret.clone())
    } else {
        Zeroizing::new(String::new())
    };

    if input.auth_kind != "none" && secret.is_empty() {
        return Err("A password or access token is required".to_string());
    }

    if input.auth_kind == "basic" && input.username.is_empty() {
        return Err("A username is required".to_string());
    }

    if input.auth_kind == "none" {
        input.username.clear();
    }

    let credentials = Credentials {
        auth_kind: input.auth_kind.clone(),
        username: input.username.clone(),
        secret: if input.auth_kind == "none" {
            String::new()
        } else {
            secret.to_string()
        },
    };

    http::verify_account(&state.client, &input.url, &credentials).await?;
    service::stop(&app).await;

    let result = run(app.state::<DbState>(), move |connection| {
        repository::save_server(connection, &input, &credentials.secret)
    })
    .await;

    let restart = service::start(&app).await;

    result?;
    restart?;

    let _ = app.emit("ntfy:changed", ());

    Ok(())
}

#[tauri::command]
pub async fn ntfy_remove_server(app: AppHandle, id: String) -> Result<(), String> {
    let state = app.state::<ServiceState>();

    let _gate = state.gate.lock().await;

    service::stop(&app).await;

    let result = run(app.state::<DbState>(), move |connection| {
        let sql = "
            DELETE FROM ntfy_servers
            WHERE id = ?1
        ";

        connection
            .execute(sql, [id])
            .map_err(|error| error.to_string())?;

        Ok(())
    })
    .await;

    let restart = service::start(&app).await;

    result?;
    restart?;

    let _ = app.emit("ntfy:changed", ());

    Ok(())
}

#[tauri::command]
pub async fn ntfy_subscribe(
    app: AppHandle,
    server_id: String,
    topic: String,
) -> Result<(), String> {
    let topic = http::validate_topic(&topic)?;

    let state = app.state::<ServiceState>();

    let _gate = state.gate.lock().await;

    let id = server_id.clone();

    let (server, credentials) = run(app.state::<DbState>(), move |connection| {
        let server = repository::server(connection, &id)?;
        let credentials = repository::credentials(connection, &id)?;

        Ok((server, credentials))
    })
    .await?;

    if !server.enabled {
        return Err("Sign in to this server before subscribing".to_string());
    }

    let subscribed_at =
        http::verify_topic(&state.client, &server.url, &topic, &credentials).await?;

    service::stop(&app).await;

    let result = run(app.state::<DbState>(), move |connection| {
        repository::subscribe(connection, &server_id, &topic, subscribed_at)
    })
    .await;

    let restart = service::start(&app).await;

    result?;
    restart?;

    let _ = app.emit("ntfy:changed", ());

    Ok(())
}

#[tauri::command]
pub async fn ntfy_update_topic(
    app: AppHandle,
    id: String,
    muted: bool,
    remove: bool,
) -> Result<(), String> {
    let state = app.state::<ServiceState>();

    let _gate = state.gate.lock().await;

    service::stop(&app).await;

    let result = run(app.state::<DbState>(), move |connection| {
        if remove {
            let sql = "
                DELETE FROM ntfy_topics
                WHERE id = ?1
            ";

            connection
                .execute(sql, [id])
                .map_err(|error| error.to_string())?;
        } else {
            let sql = "
                UPDATE ntfy_topics
                SET muted = ?2
                WHERE id = ?1
            ";

            connection
                .execute(sql, params![id, muted])
                .map_err(|error| error.to_string())?;
        }

        Ok(())
    })
    .await;

    let restart = service::start(&app).await;

    result?;
    restart?;

    let _ = app.emit("ntfy:changed", ());

    Ok(())
}

#[tauri::command]
pub async fn ntfy_messages(
    app: AppHandle,
    query: MessageQuery,
) -> Result<Vec<StoredMessage>, String> {
    if query.search.len() > 1000 {
        return Err("Search text is too long".to_string());
    }

    run(app.state::<DbState>(), move |connection| {
        repository::messages(connection, &query)
    })
    .await
}

#[tauri::command]
pub async fn ntfy_message_action(
    app: AppHandle,
    row_id: Option<i64>,
    topic_id: Option<String>,
    delete: bool,
) -> Result<(), String> {
    run(app.state::<DbState>(), move |connection| {
        if delete && row_id.is_none() && topic_id.is_none() {
            return Err("Choose a topic or notification to delete".to_string());
        }

        let sql = if delete {
            "
                DELETE FROM ntfy_messages
                WHERE (?1 IS NULL OR row_id = ?1)
                  AND (?2 IS NULL OR topic_id = ?2)
            "
        } else {
            "
                UPDATE ntfy_messages
                SET is_read = 1
                WHERE (?1 IS NULL OR row_id = ?1)
                  AND (?2 IS NULL OR topic_id = ?2)
            "
        };

        connection
            .execute(sql, params![row_id, topic_id])
            .map_err(|error| error.to_string())?;

        Ok(())
    })
    .await?;

    let _ = app.emit("ntfy:changed", ());

    Ok(())
}

#[tauri::command]
pub async fn ntfy_publish(app: AppHandle, input: PublishInput) -> Result<(), String> {
    if input.message.trim().is_empty()
        || input.message.len() > 4096
        || input.title.len() > 256
        || !(1..=5).contains(&input.priority)
        || input.tags.len() > 20
        || input.tags.iter().any(|tag| tag.len() > 64)
    {
        return Err(
            "Enter a message up to 4096 bytes, a title up to 256 bytes, and a priority from 1 to 5"
                .to_string(),
        );
    }

    let id = input.topic_id.clone();

    let (topic, server, credentials) = run(app.state::<DbState>(), move |connection| {
        let topic = repository::topic(connection, &id)?;
        let server = repository::server(connection, &topic.server_id)?;
        let credentials = repository::credentials(connection, &topic.server_id)?;

        Ok((topic, server, credentials))
    })
    .await?;

    if !server.enabled {
        return Err("Sign in to this server to publish".to_string());
    }

    let request = app
        .state::<ServiceState>()
        .client
        .post(http::endpoint(&server.url, "")?)
        .timeout(std::time::Duration::from_secs(20))
        .json(&serde_json::json!({
            "topic": topic.topic,
            "title": input.title,
            "message": input.message,
            "priority": input.priority,
            "tags": input.tags,
        }));

    http::checked(http::authenticate(request, &credentials)?).await?;

    Ok(())
}

#[tauri::command]
pub async fn ntfy_reconnect(app: AppHandle) -> Result<(), String> {
    let state = app.state::<ServiceState>();

    let _gate = state.gate.lock().await;

    service::restart(&app).await
}

#[tauri::command]
pub async fn ntfy_preferences(app: AppHandle, preview: Option<bool>) -> Result<bool, String> {
    run(app.state::<DbState>(), move |connection| {
        if let Some(preview) = preview {
            let sql = "
                INSERT OR REPLACE INTO app_meta (key, value)
                VALUES ('notification_preview', ?1)
            ";

            let value = if preview { "1" } else { "0" };

            connection
                .execute(sql, [value])
                .map_err(|error| error.to_string())?;
        }

        let preview = repository::meta(connection, "notification_preview")?;

        Ok(preview.as_deref() == Some("1"))
    })
    .await
}

#[tauri::command]
pub fn ntfy_open_url(app: AppHandle, url: String) -> Result<(), String> {
    let url = url::Url::parse(&url).map_err(|_| "Invalid link".to_string())?;

    if url.scheme() != "https" || !url.username().is_empty() || url.password().is_some() {
        return Err("Only HTTPS links without embedded credentials can be opened".to_string());
    }

    tauri_plugin_opener::OpenerExt::opener(&app)
        .open_url(url.as_str(), None::<&str>)
        .map_err(|_| "Cannot open this link".to_string())
}

#[tauri::command]
pub async fn get_url(app: AppHandle) -> Result<Option<String>, String> {
    run(app.state::<DbState>(), |connection| {
        let servers = repository::servers(connection)?;

        let url = servers
            .into_iter()
            .find(|server| server.enabled)
            .map(|server| server.url);

        Ok(url)
    })
    .await
}
