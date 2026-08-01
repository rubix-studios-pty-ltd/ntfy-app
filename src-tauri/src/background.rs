use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

use futures_util::StreamExt;
use serde::Deserialize;
use tauri::async_runtime::JoinHandle;
use tauri::{AppHandle, Manager};
use tokio::sync::oneshot;
use tokio::task::AbortHandle;
use tokio_tungstenite::connect_async;
use tokio_tungstenite::tungstenite::Message;
use url::Url;
use uuid::Uuid;

use crate::config::load_config;
use crate::listener::{Payload, process_notification};

const RETRY_BACKOFF_SECONDS: [u64; 6] = [5, 10, 20, 30, 60, 120];

#[derive(Default)]
pub struct ListenerState {
    inner: Mutex<BackgroundListener>,
}

#[derive(Default)]
struct BackgroundListener {
    connections: HashMap<String, BackgroundConnection>,
    sync_complete: bool,
    unload_requested: bool,
    unload_scheduled: bool,
}

struct BackgroundConnection {
    abort_handle: AbortHandle,
    fingerprint: String,
    generation: String,
    ready: bool,
}

struct ParsedConnection {
    fingerprint: String,
    initial_since: Option<String>,
    key: String,
    websocket_url: Url,
}

#[derive(Debug, Deserialize)]
struct WebSocketEvent {
    event: String,
    id: Option<String>,
    message: Option<String>,
    time: Option<i64>,
    title: Option<String>,
    topic: Option<String>,
}

#[tauri::command]
pub fn sync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    if !is_ntfy_websocket(&url) {
        return Ok(());
    }

    let parsed = parse_connection(&app_handle, &url)?;
    let generation = Uuid::new_v4().to_string();
    let (start_sender, start_receiver) = oneshot::channel();

    let task = spawn_connection(
        app_handle.clone(),
        parsed.key.clone(),
        generation.clone(),
        parsed.websocket_url,
        parsed.initial_since,
        start_receiver,
    );

    let new_connection = BackgroundConnection {
        abort_handle: task.inner().abort_handle(),
        fingerprint: parsed.fingerprint.clone(),
        generation,
        ready: false,
    };

    let previous = {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.sync_complete = false;

        if let Some(existing) = inner.connections.get(&parsed.key)
            && existing.fingerprint == parsed.fingerprint
        {
            task.abort();
            return Ok(());
        }

        inner.connections.insert(parsed.key, new_connection)
    };

    if let Some(previous) = previous {
        previous.abort_handle.abort();
    }

    let _ = start_sender.send(());

    Ok(())
}

#[tauri::command]
pub fn unsync_websocket(app_handle: AppHandle, url: String) -> Result<(), String> {
    if !is_ntfy_websocket(&url) {
        return Ok(());
    }

    let parsed = parse_connection(&app_handle, &url)?;

    let removed = {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.sync_complete = false;
        inner.connections.remove(&parsed.key)
    };

    if let Some(removed) = removed {
        removed.abort_handle.abort();
    }

    Ok(())
}

#[tauri::command]
pub fn complete_websocket(app_handle: AppHandle, page_url: String) -> Result<bool, String> {
    if validate_page_url(&app_handle, &page_url).is_err() {
        return Ok(false);
    }

    {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.sync_complete = true;
    }

    try_unload_webview(&app_handle);

    Ok(true)
}

pub fn request_webview_unload(app: &AppHandle) {
    if load_config(app).instance_url.is_none()
        && let Ok(mut inner) = app.state::<ListenerState>().inner.lock()
    {
        inner.sync_complete = true;
    }

    if let Ok(mut inner) = app.state::<ListenerState>().inner.lock() {
        inner.unload_requested = true;
    }

    try_unload_webview(app);
}

pub fn cancel_webview_unload(app: &AppHandle) {
    if let Ok(mut inner) = app.state::<ListenerState>().inner.lock() {
        inner.unload_requested = false;
    }
}

pub fn stop_all(app: &AppHandle) {
    let connections = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        inner
            .connections
            .drain()
            .map(|(_, value)| value)
            .collect::<Vec<_>>()
    };

    for connection in connections {
        connection.abort_handle.abort();
    }
}

fn spawn_connection(
    app: AppHandle,
    key: String,
    generation: String,
    websocket_url: Url,
    initial_since: Option<String>,
    start_receiver: oneshot::Receiver<()>,
) -> JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        if start_receiver.await.is_err() {
            return;
        }

        run_connection(app, key, generation, websocket_url, initial_since).await;
    })
}

async fn run_connection(
    app: AppHandle,
    key: String,
    generation: String,
    websocket_url: Url,
    mut last_id: Option<String>,
) {
    let mut retry_count = 0usize;

    loop {
        if !is_current_connection(&app, &key, &generation) {
            return;
        }

        let request_url = with_since(&websocket_url, last_id.as_deref());

        match connect_async(request_url.as_str()).await {
            Ok((mut websocket, _response)) => {
                mark_connection_ready(&app, &key, &generation);
                retry_count = 0;

                while let Some(result) = websocket.next().await {
                    if !is_current_connection(&app, &key, &generation) {
                        return;
                    }

                    match result {
                        Ok(Message::Text(message)) => {
                            handle_message(&app, message.as_ref(), &mut last_id).await;
                        }

                        Ok(Message::Close(_)) => break,
                        Ok(_) => {}

                        Err(_error) => {
                            eprintln!("ntfy background WebSocket ended for {key}");
                            break;
                        }
                    }
                }
            }

            Err(_error) => {
                eprintln!("Failed to connect ntfy background WebSocket for {key}");
            }
        }

        if !is_current_connection(&app, &key, &generation) {
            return;
        }

        let delay =
            RETRY_BACKOFF_SECONDS[retry_count.min(RETRY_BACKOFF_SECONDS.len().saturating_sub(1))];
        retry_count = retry_count.saturating_add(1);

        tokio::time::sleep(Duration::from_secs(delay)).await;
    }
}

async fn handle_message(app: &AppHandle, message: &str, last_id: &mut Option<String>) {
    let Ok(event) = serde_json::from_str::<WebSocketEvent>(message) else {
        return;
    };

    if let Some(id) = event.id.as_ref()
        && matches!(
            event.event.as_str(),
            "message" | "message_delete" | "message_clear"
        )
    {
        *last_id = Some(id.clone());
    }

    if event.event != "message" {
        return;
    }

    let Some(message) = event.message else {
        return;
    };

    if message.starts_with('{') {
        return;
    }

    let topic = event.topic.unwrap_or_default();
    let title = event
        .title
        .or_else(|| (!topic.is_empty()).then(|| topic.clone()));

    let notification = Payload {
        id: event.id,
        message: clean_message(&message),
        time: event.time,
        title,
        topic,
    };

    process_notification(app, notification).await;
}

fn clean_message(message: &str) -> String {
    let mut message = message.replace("â¯", " ");

    while message.contains("\n\n") {
        message = message.replace("\n\n", "\n");
    }

    message.trim().to_string()
}

fn mark_connection_ready(app: &AppHandle, key: &str, generation: &str) {
    let changed = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        let Some(connection) = inner.connections.get_mut(key) else {
            return;
        };

        if connection.generation != generation || connection.ready {
            false
        } else {
            connection.ready = true;
            true
        }
    };

    if changed {
        try_unload_webview(app);
    }
}

fn is_current_connection(app: &AppHandle, key: &str, generation: &str) -> bool {
    let state = app.state::<ListenerState>();
    let Ok(inner) = state.inner.lock() else {
        return false;
    };

    inner
        .connections
        .get(key)
        .is_some_and(|connection| connection.generation == generation)
}

fn try_unload_webview(app: &AppHandle) {
    let should_schedule = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        let ready = inner.sync_complete
            && inner
                .connections
                .values()
                .all(|connection| connection.ready);

        if !inner.unload_requested || !ready || inner.unload_scheduled {
            false
        } else {
            inner.unload_scheduled = true;
            true
        }
    };

    if !should_schedule {
        return;
    }

    let app = app.clone();

    tauri::async_runtime::spawn(async move {
        tokio::task::yield_now().await;

        let unloaded = {
            let state = app.state::<ListenerState>();
            let Ok(mut inner) = state.inner.lock() else {
                return;
            };

            inner.unload_scheduled = false;

            let ready = inner.sync_complete
                && inner
                    .connections
                    .values()
                    .all(|connection| connection.ready);

            if !inner.unload_requested || !ready {
                return;
            }

            let unloaded = app
                .get_webview_window("main")
                .is_none_or(|window| window.destroy().is_ok());

            if unloaded {
                inner.unload_requested = false;
            }

            unloaded
        };

        if unloaded {
            crate::tray::system::sync_tray_label(&app);
        }
    });
}

fn parse_connection(app: &AppHandle, source: &str) -> Result<ParsedConnection, String> {
    let instance = load_config(app)
        .instance_url
        .ok_or_else(|| "No ntfy instance is configured".to_string())?;

    parse_connection_urls(&instance, source)
}

fn validate_page_url(app: &AppHandle, source: &str) -> Result<(), String> {
    let instance = load_config(app)
        .instance_url
        .ok_or_else(|| "No ntfy instance is configured".to_string())?;
    let instance = Url::parse(&instance).map_err(|error| error.to_string())?;
    let page = Url::parse(source).map_err(|error| error.to_string())?;

    if page.scheme() != instance.scheme()
        || page.host_str() != instance.host_str()
        || page.port_or_known_default() != instance.port_or_known_default()
    {
        return Err("The page does not belong to the configured ntfy instance".to_string());
    }

    let base_path = instance.path().trim_end_matches('/');

    if !base_path.is_empty()
        && page.path() != base_path
        && !page.path().starts_with(&format!("{base_path}/"))
    {
        return Err("The page is outside the configured ntfy instance path".to_string());
    }

    Ok(())
}

fn is_ntfy_websocket(source: &str) -> bool {
    let Ok(url) = Url::parse(source) else {
        return false;
    };

    if !matches!(url.scheme(), "ws" | "wss") {
        return false;
    }

    url.path()
        .strip_suffix("/ws")
        .is_some_and(|topic_path| !topic_path.trim_matches('/').is_empty())
}

fn parse_connection_urls(instance: &str, source: &str) -> Result<ParsedConnection, String> {
    let instance = Url::parse(instance).map_err(|error| error.to_string())?;
    let mut websocket_url = Url::parse(source).map_err(|error| error.to_string())?;

    let expected_websocket_scheme = match instance.scheme() {
        "https" => "wss",
        "http" => "ws",
        _ => return Err("The configured ntfy instance must use HTTP or HTTPS".to_string()),
    };

    if websocket_url.scheme() != expected_websocket_scheme
        || websocket_url.host_str() != instance.host_str()
        || websocket_url.port_or_known_default() != instance.port_or_known_default()
    {
        return Err("The WebSocket does not belong to the configured ntfy instance".to_string());
    }

    let base_path = instance.path().trim_end_matches('/');

    if !base_path.is_empty()
        && websocket_url.path() != base_path
        && !websocket_url.path().starts_with(&format!("{base_path}/"))
    {
        return Err("The WebSocket is outside the configured ntfy instance path".to_string());
    }

    let topic_path = websocket_url
        .path()
        .strip_suffix("/ws")
        .filter(|path| !path.trim_matches('/').is_empty())
        .ok_or_else(|| "The ntfy WebSocket URL does not contain a topic".to_string())?
        .to_string();

    let query = websocket_url
        .query_pairs()
        .map(|(key, value)| (key.into_owned(), value.into_owned()))
        .collect::<Vec<_>>();

    let initial_since = query
        .iter()
        .find(|(key, _)| key.eq_ignore_ascii_case("since"))
        .map(|(_, value)| value.clone());
    let retained_query = query
        .into_iter()
        .filter(|(key, _)| !key.eq_ignore_ascii_case("since"))
        .collect::<Vec<_>>();

    websocket_url.set_fragment(None);
    websocket_url.set_query(None);

    if !retained_query.is_empty() {
        let mut pairs = websocket_url.query_pairs_mut();

        for (key, value) in retained_query {
            pairs.append_pair(&key, &value);
        }
    }

    let host = websocket_url
        .host_str()
        .ok_or_else(|| "The ntfy WebSocket URL has no host".to_string())?;
    let authority = websocket_url
        .port()
        .map(|port| format!("{host}:{port}"))
        .unwrap_or_else(|| host.to_string());
    let key = format!("{}://{authority}{topic_path}", instance.scheme());
    let fingerprint = websocket_url.as_str().to_string();

    Ok(ParsedConnection {
        fingerprint,
        initial_since,
        key,
        websocket_url,
    })
}

fn with_since(base_url: &Url, since: Option<&str>) -> Url {
    let mut url = base_url.clone();

    if let Some(since) = since.filter(|value| !value.is_empty()) {
        url.query_pairs_mut().append_pair("since", since);
    }

    url
}
