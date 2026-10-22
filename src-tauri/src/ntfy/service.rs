use super::http;
use super::models::{ConnectionStatus, Credentials, Message, Server, Topic};

use crate::db::{DbState, repo::ntfy as repository, run};

use futures_util::StreamExt;
use std::{collections::HashMap, sync::Mutex, time::Duration};
use tauri::{AppHandle, Emitter, Manager};
use tokio::sync::watch;

const MAX_FRAME_BYTES: usize = 1024 * 1024;

pub struct Worker {
    stop: watch::Sender<bool>,
    task: tauri::async_runtime::JoinHandle<()>,
}

pub struct ServiceState {
    pub client: reqwest::Client,
    pub gate: tokio::sync::Mutex<()>,
    workers: tokio::sync::Mutex<Vec<Worker>>,
    statuses: Mutex<HashMap<String, ConnectionStatus>>,
}

impl ServiceState {
    pub fn new() -> Result<Self, String> {
        Ok(Self {
            client: http::client()?,
            gate: tokio::sync::Mutex::new(()),
            workers: tokio::sync::Mutex::new(Vec::new()),
            statuses: Mutex::new(HashMap::new()),
        })
    }

    pub fn statuses(&self) -> Vec<ConnectionStatus> {
        self.statuses
            .lock()
            .map(|statuses| statuses.values().cloned().collect())
            .unwrap_or_default()
    }
}

pub async fn stop(app: &AppHandle) {
    let workers = std::mem::take(&mut *app.state::<ServiceState>().workers.lock().await);

    for worker in &workers {
        let _ = worker.stop.send(true);
    }

    for worker in workers {
        let _ = worker.task.await;
    }

    if let Ok(mut statuses) = app.state::<ServiceState>().statuses.lock() {
        statuses.clear();
    }
}

pub async fn start(app: &AppHandle) -> Result<(), String> {
    let (servers, topics) = run(app.state::<DbState>(), |connection| {
        Ok((
            repository::servers(connection)?,
            repository::topics(connection)?,
        ))
    })
    .await?;

    for server in servers.into_iter().filter(|server| server.enabled) {
        let topics: Vec<_> = topics
            .iter()
            .filter(|topic| topic.server_id == server.id)
            .cloned()
            .collect();

        if topics.is_empty() {
            continue;
        }

        let id = server.id.clone();

        let credentials = run(app.state::<DbState>(), move |connection| {
            repository::credentials(connection, &id)
        })
        .await?;

        let (stop, receiver) = watch::channel(false);

        let handle = app.clone();

        let task = tauri::async_runtime::spawn(async move {
            worker(&handle, server, credentials, topics, receiver).await;
        });

        app.state::<ServiceState>()
            .workers
            .lock()
            .await
            .push(Worker { stop, task });
    }

    Ok(())
}

pub async fn restart(app: &AppHandle) -> Result<(), String> {
    stop(app).await;
    start(app).await
}

fn status(app: &AppHandle, topics: &[Topic], state: &str, detail: Option<String>) {
    if let Ok(mut statuses) = app.state::<ServiceState>().statuses.lock() {
        for topic in topics {
            let value = ConnectionStatus {
                topic_id: topic.id.clone(),
                state: state.to_string(),
                detail: detail.clone(),
            };

            statuses.insert(topic.id.clone(), value.clone());

            let _ = app.emit("ntfy:connection", value);
        }
    }
}

async fn worker(
    app: &AppHandle,
    server: Server,
    credentials: Credentials,
    topics: Vec<Topic>,
    mut stop: watch::Receiver<bool>,
) {
    let mut delay = 1u64;

    loop {
        if *stop.borrow() {
            break;
        }

        status(app, &topics, "connecting", None);

        let connected_at = std::time::Instant::now();

        let mut requested_delay = None;

        let result = stream(
            app,
            &server,
            &credentials,
            &topics,
            &mut stop,
            &mut requested_delay,
        )
        .await;

        if *stop.borrow() {
            break;
        }

        if connected_at.elapsed() >= Duration::from_secs(60) {
            delay = 1;
        }

        status(
            app,
            &topics,
            "reconnecting",
            Some(
                result
                    .err()
                    .unwrap_or_else(|| "Connection closed. Reconnecting.".to_string()),
            ),
        );

        let jitter = u64::from(uuid::Uuid::new_v4().as_bytes()[0]) * 4;

        tokio::select! {
            biased;
            _ = stop.changed() => break,
            _ = tokio::time::sleep(Duration::from_millis(requested_delay.unwrap_or(delay).max(delay) * 1000 + jitter)) => {},
        }
        delay = (delay * 2).min(120);
    }

    status(app, &topics, "stopped", None);
}

async fn stream(
    app: &AppHandle,
    server: &Server,
    credentials: &Credentials,
    initial_topics: &[Topic],
    stop: &mut watch::Receiver<bool>,
    retry_delay: &mut Option<u64>,
) -> Result<(), String> {
    let server_id = server.id.clone();

    let topics = run(app.state::<DbState>(), move |connection| {
        Ok(repository::topics(connection)?
            .into_iter()
            .filter(|topic| topic.server_id == server_id)
            .collect::<Vec<_>>())
    })
    .await?;

    let since = topics
        .iter()
        .map(|topic| topic.cursor_time.unwrap_or(topic.subscribed_at))
        .min()
        .unwrap_or_else(|| chrono::Utc::now().timestamp())
        .saturating_sub(1);

    let names = topics
        .iter()
        .map(|topic| topic.topic.as_str())
        .collect::<Vec<_>>()
        .join(",");

    let mut url = http::endpoint(&server.url, &format!("{names}/json"))?;

    url.query_pairs_mut()
        .append_pair("since", &since.to_string());

    let client = app.state::<ServiceState>().client.clone();

    let response = tokio::select! {
        biased;
        _ = stop.changed() => return Ok(()),
        response = http::send(http::authenticate(client.get(url),credentials)?) => response?,
    };

    if !response.status().is_success() {
        if response.status().as_u16() == 429 || response.status().as_u16() == 503 {
            let retry = response
                .headers()
                .get(reqwest::header::RETRY_AFTER)
                .and_then(|header| header.to_str().ok())
                .and_then(|value| {
                    value.parse::<u64>().ok().or_else(|| {
                        chrono::DateTime::parse_from_rfc2822(value)
                            .ok()
                            .map(|date| {
                                date.timestamp()
                                    .saturating_sub(chrono::Utc::now().timestamp())
                                    .max(1) as u64
                            })
                    })
                })
                .unwrap_or(60)
                .clamp(1, 86400);
            *retry_delay = Some(retry);
        }

        return Err(http::status_error(response.status()));
    }
    let truncated = response
        .headers()
        .get("X-Messages-Truncated")
        .is_some_and(|value| value == "1");

    status(
        app,
        initial_topics,
        "connected",
        if truncated {
            Some("The server truncated its cached history. Some older notifications are unavailable.".to_string())
        } else {
            None
        },
    );

    let mut bytes = response.bytes_stream();

    let mut pending = Vec::new();

    loop {
        let chunk = tokio::select! {
            biased;
            _ = stop.changed() => return Ok(()),
            result = tokio::time::timeout(Duration::from_secs(90),bytes.next()) => result.map_err(|_| "No keepalive received. Reconnecting.".to_string())?,
        };

        let Some(chunk) = chunk else {
            break;
        };

        let chunk = chunk.map_err(|_| "The notification stream was interrupted".to_string())?;

        for byte in chunk {
            if *stop.borrow() {
                return Ok(());
            }

            if byte == b'\n' {
                if !pending.is_empty() {
                    let message: Message = serde_json::from_slice(&pending)
                        .map_err(|_| "The ntfy stream contains an invalid message".to_string())?;
                    pending.clear();

                    if matches!(
                        message.event.as_str(),
                        "message" | "message_clear" | "message_delete"
                    ) && let Some(topic) =
                        topics.iter().find(|topic| topic.topic == message.topic)
                    {
                        if message.id.is_empty() || message.time < topic.subscribed_at {
                            continue;
                        }
                        super::notifications::process_notification(app, topic, &message).await?;
                    }
                }
            } else {
                if pending.len() >= MAX_FRAME_BYTES {
                    return Err("The ntfy stream exceeded the message size limit".to_string());
                }

                pending.push(byte);
            }
        }
    }

    Err("The ntfy stream ended. Reconnecting.".to_string())
}
