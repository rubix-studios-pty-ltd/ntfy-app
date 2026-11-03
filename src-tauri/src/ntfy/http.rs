use super::models::Credentials;
use base64::{Engine, engine::general_purpose::STANDARD};
use futures_util::StreamExt;
use reqwest::{Client, RequestBuilder, Response, StatusCode};
use std::time::Duration;
use url::Url;
use zeroize::Zeroizing;

pub fn client() -> Result<Client, String> {
    Client::builder()
        .redirect(reqwest::redirect::Policy::none())
        .connect_timeout(Duration::from_secs(15))
        .read_timeout(Duration::from_secs(90))
        .tcp_keepalive(Duration::from_secs(30))
        .user_agent(concat!("Rubix-Ntfy/", env!("CARGO_PKG_VERSION")))
        .build()
        .map_err(|_| "Cannot initialise the secure HTTP client".to_string())
}

pub fn validate_server(value: &str) -> Result<String, String> {
    let mut url =
        Url::parse(value.trim()).map_err(|_| "Enter a valid HTTPS server URL".to_string())?;

    if url.scheme() != "https" || url.host_str().is_none() {
        return Err(
            "An HTTPS server URL is required to protect credentials and notification content"
                .to_string(),
        );
    }

    if !url.username().is_empty()
        || url.password().is_some()
        || url.query().is_some()
        || url.fragment().is_some()
    {
        return Err(
            "Server URLs cannot contain credentials, query parameters or fragments".to_string(),
        );
    }

    let path = url.path().trim_end_matches('/').to_string();

    url.set_path(&path);

    Ok(url.as_str().trim_end_matches('/').to_string())
}

pub fn validate_topic(value: &str) -> Result<String, String> {
    let topic = value.trim();

    if topic.is_empty()
        || topic.len() > 64
        || !topic
            .bytes()
            .all(|byte| byte.is_ascii_alphanumeric() || matches!(byte, b'_' | b'-'))
    {
        return Err("Topics must use 1 to 64 letters, numbers, underscores or hyphens".to_string());
    }

    if [
        "docs", "static", "file", "app", "metrics", "account", "settings", "signup", "login", "v1",
    ]
    .contains(&topic)
    {
        return Err("That topic name is reserved by ntfy".to_string());
    }

    Ok(topic.to_string())
}

pub fn endpoint(base: &str, suffix: &str) -> Result<Url, String> {
    let base = validate_server(base)?;

    Url::parse(&format!("{base}/{suffix}"))
        .map_err(|_| "Cannot construct the ntfy endpoint".to_string())
}

pub fn authenticate(
    request: RequestBuilder,
    credentials: &Credentials,
) -> Result<RequestBuilder, String> {
    let header = match credentials.auth_kind.as_str() {
        "none" => return Ok(request),
        "basic" => {
            let pair = Zeroizing::new(format!("{}:{}", credentials.username, credentials.secret));
            Zeroizing::new(format!("Basic {}", STANDARD.encode(pair.as_bytes())))
        }
        "token" => Zeroizing::new(format!("Bearer {}", credentials.secret)),
        _ => return Err("Unsupported authentication method".to_string()),
    };

    let mut value = reqwest::header::HeaderValue::from_str(&header)
        .map_err(|_| "Credentials contain invalid header characters".to_string())?;

    value.set_sensitive(true);

    Ok(request.header(reqwest::header::AUTHORIZATION, value))
}

pub fn status_error(status: StatusCode) -> String {
    match status.as_u16() {
        401 | 403 => "Access denied. Check your credentials and topic permissions.".to_string(),
        429 => "Server rate limit reached. The client will retry after a delay.".to_string(),
        _ => format!("The ntfy server returned HTTP {}", status.as_u16()),
    }
}

pub async fn send(request: RequestBuilder) -> Result<Response, String> {
    request.send().await.map_err(|error| {
        if error.is_timeout() {
            "The ntfy request timed out".to_string()
        } else {
            "Cannot reach ntfy. Check the connection and TLS certificate.".to_string()
        }
    })
}

pub async fn checked(request: RequestBuilder) -> Result<Response, String> {
    let response = send(request).await?;

    if !response.status().is_success() {
        return Err(status_error(response.status()));
    }

    Ok(response)
}

pub async fn verify_account(
    client: &Client,
    base: &str,
    credentials: &Credentials,
) -> Result<(), String> {
    let response = checked(authenticate(
        client
            .get(endpoint(base, "v1/account")?)
            .timeout(Duration::from_secs(20)),
        credentials,
    )?)
    .await?;

    let mut stream = response.bytes_stream();

    let mut body = Zeroizing::new(Vec::new());

    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|_| "The ntfy account response was interrupted".to_string())?;

        if body.len() + chunk.len() > 1024 * 1024 {
            return Err("The ntfy account response exceeded the size limit".to_string());
        }

        body.extend_from_slice(&chunk);
    }

    let account: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|_| "The server did not return a valid ntfy account".to_string())?;

    if !account
        .get("limits")
        .is_some_and(serde_json::Value::is_object)
    {
        return Err("The URL did not return the ntfy account API".to_string());
    }

    if credentials.auth_kind != "none"
        && account
            .get("username")
            .and_then(|value| value.as_str())
            .is_none_or(|value| value.is_empty() || value == "*")
    {
        return Err("The server did not authenticate this account".to_string());
    }

    Ok(())
}

pub async fn verify_topic(
    client: &Client,
    base: &str,
    topic: &str,
    credentials: &Credentials,
) -> Result<i64, String> {
    let mut url = endpoint(base, &format!("{topic}/json"))?;

    url.query_pairs_mut()
        .append_pair("poll", "1")
        .append_pair("since", &chrono::Utc::now().timestamp().to_string());

    let response = checked(authenticate(
        client.get(url).timeout(Duration::from_secs(20)),
        credentials,
    )?)
    .await?;

    let timestamp = response
        .headers()
        .get(reqwest::header::DATE)
        .and_then(|value| value.to_str().ok())
        .and_then(|value| chrono::DateTime::parse_from_rfc2822(value).ok())
        .map(|date| date.timestamp())
        .unwrap_or_else(|| chrono::Utc::now().timestamp());

    Ok(timestamp)
}
