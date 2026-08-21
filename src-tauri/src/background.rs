use std::collections::HashSet;
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
    topics: HashSet<String>,
    auth: Option<String>,
    connection: Option<BackgroundConnection>,
    sync_complete: bool,
    unload_requested: bool,
    unload_scheduled: bool,
}

struct BackgroundConnection {
    abort_handle: AbortHandle,
    generation: String,
}

struct ParsedTopic {
    topic_path: String,
    auth: Option<String>,
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

pub(crate) fn sync_websocket(app_handle: &AppHandle, url: &str) -> Result<(), String> {
    if !is_ntfy_websocket(url) {
        return Ok(());
    }

    let parsed = parse_topic(app_handle, url)?;

    {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.topics.insert(parsed.topic_path);

        if parsed.auth.is_some() {
            inner.auth = parsed.auth;
        }

        inner.sync_complete = false;
    }

    Ok(())
}

pub(crate) fn unsync_websocket(app_handle: &AppHandle, url: &str) -> Result<(), String> {
    if !is_ntfy_websocket(url) {
        return Ok(());
    }

    let parsed = parse_topic(app_handle, url)?;

    {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.topics.remove(&parsed.topic_path);

        if inner.topics.is_empty() {
            inner.auth = None;
        }

        inner.sync_complete = false;
    }

    Ok(())
}

pub(crate) fn complete_websocket(app_handle: &AppHandle, page_url: &str) -> Result<bool, String> {
    if validate_page_url(app_handle, page_url).is_err() {
        return Ok(false);
    }

    {
        let state = app_handle.state::<ListenerState>();
        let mut inner = state.inner.lock().map_err(|error| error.to_string())?;

        inner.sync_complete = true;
    }

    try_unload_webview(app_handle);

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
    let connection = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        inner.unload_requested = false;
        inner.connection.take()
    };

    if let Some(connection) = connection {
        connection.abort_handle.abort();
    }
}

pub fn stop_all(app: &AppHandle) {
    let connection = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        inner.unload_requested = false;
        inner.connection.take()
    };

    if let Some(connection) = connection {
        connection.abort_handle.abort();
    }
}

fn rebuild_connection(app: &AppHandle) {
    let (topics, auth) = {
        let state = app.state::<ListenerState>();
        let Ok(inner) = state.inner.lock() else {
            return;
        };

        if !inner.unload_requested {
            return;
        }

        let mut topics = inner.topics.iter().cloned().collect::<Vec<_>>();
        topics.sort();

        (topics, inner.auth.clone())
    };

    if topics.is_empty() {
        return;
    }

    let Some(instance_url) = load_config(app).instance_url else {
        return;
    };

    let Ok(instance) = Url::parse(&instance_url) else {
        return;
    };

    let Some(websocket_url) = build_combined_url(&instance, &topics, auth.as_deref()) else {
        return;
    };

    let generation = Uuid::new_v4().to_string();
    let (start_sender, start_receiver) = oneshot::channel();
    let task = spawn_connection(
        app.clone(),
        generation.clone(),
        websocket_url,
        start_receiver,
    );

    let previous = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        if !inner.unload_requested {
            return;
        }

        inner.connection.replace(BackgroundConnection {
            abort_handle: task.inner().abort_handle(),
            generation,
        })
    };

    if let Some(previous) = previous {
        previous.abort_handle.abort();
    }

    let _ = start_sender.send(());
}

fn spawn_connection(
    app: AppHandle,
    generation: String,
    websocket_url: Url,
    start_receiver: oneshot::Receiver<()>,
) -> JoinHandle<()> {
    tauri::async_runtime::spawn(async move {
        if start_receiver.await.is_err() {
            return;
        }

        run_connection(app, generation, websocket_url).await;
    })
}

async fn run_connection(app: AppHandle, generation: String, websocket_url: Url) {
    let mut retry_count = 0usize;
    let mut last_id: Option<String> = None;

    loop {
        if !is_current_connection(&app, &generation) {
            return;
        }

        let request_url = with_since(&websocket_url, last_id.as_deref());

        match connect_async(request_url.as_str()).await {
            Ok((mut websocket, _response)) => {
                retry_count = 0;

                while let Some(result) = websocket.next().await {
                    if !is_current_connection(&app, &generation) {
                        return;
                    }

                    match result {
                        Ok(Message::Text(message)) => {
                            handle_message(&app, message.as_ref(), &mut last_id).await;
                        }

                        Ok(Message::Close(_)) => break,
                        Ok(_) => {}

                        Err(_error) => {
                            eprintln!("ntfy background WebSocket ended");
                            break;
                        }
                    }
                }
            }

            Err(error) => {
                eprintln!("Failed to connect ntfy background WebSocket: {error}");
            }
        }

        if !is_current_connection(&app, &generation) {
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
    let mut message = message
        .replace('\u{202f}', " ")
        .replace("\u{00e2}\u{0080}\u{00af}", " ")
        .replace("\u{00e2}\u{20ac}\u{00af}", " ");

    while message.contains("\n\n") {
        message = message.replace("\n\n", "\n");
    }

    message.trim().to_string()
}

fn is_current_connection(app: &AppHandle, generation: &str) -> bool {
    let state = app.state::<ListenerState>();
    let Ok(inner) = state.inner.lock() else {
        return false;
    };

    inner
        .connection
        .as_ref()
        .is_some_and(|connection| connection.generation == generation)
}

fn try_unload_webview(app: &AppHandle) {
    if app.get_webview_window("main").is_none() {
        return;
    }

    let should_schedule = {
        let state = app.state::<ListenerState>();
        let Ok(mut inner) = state.inner.lock() else {
            return;
        };

        if !inner.unload_requested || !inner.sync_complete || inner.unload_scheduled {
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

            if !inner.unload_requested || !inner.sync_complete {
                inner.unload_scheduled = false;
                return;
            }

            let unloaded = app
                .get_webview_window("main")
                .is_none_or(|window| window.destroy().is_ok());

            inner.unload_scheduled = false;

            unloaded
        };

        if unloaded {
            rebuild_connection(&app);
            crate::tray::system::sync_tray_label(&app);
        }
    });
}

fn parse_topic(app: &AppHandle, source: &str) -> Result<ParsedTopic, String> {
    let instance = load_config(app)
        .instance_url
        .ok_or_else(|| "No ntfy instance is configured".to_string())?;

    parse_topic_url(&instance, source)
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

fn parse_topic_url(instance: &str, source: &str) -> Result<ParsedTopic, String> {
    let instance = Url::parse(instance).map_err(|error| error.to_string())?;
    let websocket_url = Url::parse(source).map_err(|error| error.to_string())?;

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
        .strip_prefix(base_path)
        .unwrap_or(websocket_url.path())
        .trim_matches('/')
        .to_string();

    if topic_path.is_empty() {
        return Err("The ntfy WebSocket URL does not contain a topic".to_string());
    }

    let auth = websocket_url
        .query_pairs()
        .find(|(key, _)| key.eq_ignore_ascii_case("auth"))
        .map(|(_, value)| value.into_owned());

    Ok(ParsedTopic { topic_path, auth })
}

fn build_combined_url(instance: &Url, topics: &[String], auth: Option<&str>) -> Option<Url> {
    let scheme = match instance.scheme() {
        "https" => "wss",
        "http" => "ws",
        _ => return None,
    };

    let host = instance.host_str()?;
    let host = if host.contains(':') {
        format!("[{host}]")
    } else {
        host.to_string()
    };
    let authority = instance
        .port()
        .map(|port| format!("{host}:{port}"))
        .unwrap_or(host);

    let base_path = instance.path().trim_end_matches('/');
    let joined_topics = topics.join(",");

    let mut url = Url::parse(&format!(
        "{scheme}://{authority}{base_path}/{joined_topics}/ws"
    ))
    .ok()?;

    if let Some(auth) = auth {
        url.query_pairs_mut().append_pair("auth", auth);
    }

    Some(url)
}

fn with_since(base_url: &Url, since: Option<&str>) -> Url {
    let mut url = base_url.clone();

    if let Some(since) = since.filter(|value| !value.is_empty()) {
        url.query_pairs_mut().append_pair("since", since);
    }

    url
}
