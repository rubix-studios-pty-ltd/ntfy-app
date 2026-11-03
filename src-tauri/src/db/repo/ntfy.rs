use crate::ntfy::models::{
    Credentials, Message, MessageQuery, Server, ServerInput, StoredMessage, Topic,
};
use rusqlite::{Connection, OptionalExtension, params};

pub fn servers(connection: &Connection) -> Result<Vec<Server>, String> {
    let mut statement = connection
        .prepare("SELECT id,name,url,auth_kind,username,enabled FROM ntfy_servers ORDER BY name,id")
        .map_err(|error| error.to_string())?;

    statement
        .query_map([], |row| {
            Ok(Server {
                id: row.get(0)?,
                name: row.get(1)?,
                url: row.get(2)?,
                auth_kind: row.get(3)?,
                username: row.get(4)?,
                enabled: row.get(5)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|error| error.to_string())
}

pub fn server(connection: &Connection, id: &str) -> Result<Server, String> {
    servers(connection)?
        .into_iter()
        .find(|server| server.id == id)
        .ok_or_else(|| "Server not found".to_string())
}

pub fn credentials(connection: &Connection, id: &str) -> Result<Credentials, String> {
    connection
        .query_row(
            "SELECT auth_kind,username,secret FROM ntfy_servers WHERE id=?1",
            [id],
            |row| {
                Ok(Credentials {
                    auth_kind: row.get(0)?,
                    username: row.get(1)?,
                    secret: row.get(2)?,
                })
            },
        )
        .map_err(|_| "Server credentials are unavailable".to_string())
}

pub fn save_server(
    connection: &Connection,
    input: &ServerInput,
    secret: &str,
) -> Result<String, String> {
    let id = input
        .id
        .clone()
        .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());

    if input.id.is_some() {
        let old = server(connection, &id)?;

        if old.url != input.url {
            return Err("Create a separate server to use a different URL. This keeps notification history and credentials associated with the correct server.".to_string());
        }
    }

    connection.execute("INSERT INTO ntfy_servers(id,name,url,auth_kind,username,secret,enabled) VALUES(?1,?2,?3,?4,?5,?6,1) ON CONFLICT(id) DO UPDATE SET name=excluded.name,auth_kind=excluded.auth_kind,username=excluded.username,secret=excluded.secret,enabled=1",
        params![id,input.name,input.url,input.auth_kind,input.username,secret]).map_err(|error| error.to_string())?;

    Ok(id)
}

pub fn topics(connection: &Connection) -> Result<Vec<Topic>, String> {
    let mut statement = connection.prepare("SELECT t.id,t.server_id,t.topic,t.muted,t.subscribed_at,t.cursor_time,(SELECT count(*) FROM ntfy_messages m WHERE m.topic_id=t.id AND m.is_read=0) FROM ntfy_topics t ORDER BY t.topic,t.id").map_err(|error| error.to_string())?;
    statement
        .query_map([], |row| {
            Ok(Topic {
                id: row.get(0)?,
                server_id: row.get(1)?,
                topic: row.get(2)?,
                muted: row.get(3)?,
                subscribed_at: row.get(4)?,
                cursor_time: row.get(5)?,
                unread: row.get(6)?,
            })
        })
        .map_err(|error| error.to_string())?
        .collect::<Result<_, _>>()
        .map_err(|error| error.to_string())
}

pub fn topic(connection: &Connection, id: &str) -> Result<Topic, String> {
    topics(connection)?
        .into_iter()
        .find(|topic| topic.id == id)
        .ok_or_else(|| "Topic not found".to_string())
}

pub fn subscribe(
    connection: &Connection,
    server_id: &str,
    topic: &str,
    subscribed_at: i64,
) -> Result<(), String> {
    let count: i64 = connection
        .query_row("SELECT count(*) FROM ntfy_topics", [], |row| row.get(0))
        .map_err(|error| error.to_string())?;

    if count >= 100 {
        return Err("This client supports up to 100 topics".to_string());
    }

    connection
        .execute(
            "INSERT INTO ntfy_topics(id,server_id,topic,subscribed_at) VALUES(?1,?2,?3,?4)",
            params![
                uuid::Uuid::new_v4().to_string(),
                server_id,
                topic,
                subscribed_at
            ],
        )
        .map_err(|error| error.to_string())?;
    Ok(())
}

pub fn receive(connection: &Connection, topic_id: &str, message: &Message) -> Result<bool, String> {
    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;

    let inserted = transaction
        .execute(
            "INSERT OR IGNORE INTO ntfy_receipts(topic_id,message_id,received_at) VALUES(?1,?2,?3)",
            params![topic_id, message.id, chrono::Utc::now().timestamp()],
        )
        .map_err(|error| error.to_string())?;

    transaction.execute("UPDATE ntfy_topics SET cursor_time=max(coalesce(cursor_time,subscribed_at),?2) WHERE id=?1", params![topic_id,message.time]).map_err(|error| error.to_string())?;

    if inserted == 0 {
        transaction.commit().map_err(|error| error.to_string())?;
        return Ok(false);
    }

    if let Some(sequence) = message
        .sequence_id
        .as_deref()
        .filter(|value| !value.is_empty())
    {
        let predicate =
            "topic_id=?1 AND (message_id=?2 OR json_extract(payload,'$.sequence_id')=?2)";

        match message.event.as_str() {
            "message_clear" => {
                transaction
                    .execute(
                        &format!("UPDATE ntfy_messages SET is_read=1 WHERE {predicate}"),
                        params![topic_id, sequence],
                    )
                    .map_err(|error| error.to_string())?;
            }
            "message_delete" | "message" => {
                transaction
                    .execute(
                        &format!("DELETE FROM ntfy_messages WHERE {predicate}"),
                        params![topic_id, sequence],
                    )
                    .map_err(|error| error.to_string())?;
            }
            _ => {}
        }
    }

    if message.event == "message" {
        let payload = serde_json::to_string(message).map_err(|error| error.to_string())?;

        transaction
            .execute(
                "INSERT INTO ntfy_messages(topic_id,message_id,time,payload) VALUES(?1,?2,?3,?4)",
                params![topic_id, message.id, message.time, payload],
            )
            .map_err(|error| error.to_string())?;
    }

    let row_id = transaction.last_insert_rowid();

    if row_id > 0 && row_id % 250 == 0 {
        transaction.execute("DELETE FROM ntfy_messages WHERE row_id NOT IN (SELECT row_id FROM ntfy_messages ORDER BY row_id DESC LIMIT 10000)",[]).map_err(|error|error.to_string())?;
    }

    transaction.commit().map_err(|error| error.to_string())?;

    Ok(true)
}

pub fn messages(
    connection: &Connection,
    query: &MessageQuery,
) -> Result<Vec<StoredMessage>, String> {
    let mut statement = connection.prepare("SELECT row_id,topic_id,is_read,payload FROM ntfy_messages WHERE (?1 IS NULL OR topic_id=?1) AND (?2 IS NULL OR row_id<?2) AND (?3=0 OR is_read=0) AND (?4='' OR instr(lower(coalesce(json_extract(payload,'$.title'),'')),lower(?4))>0 OR instr(lower(coalesce(json_extract(payload,'$.message'),'')),lower(?4))>0 OR instr(lower(coalesce(json_extract(payload,'$.topic'),'')),lower(?4))>0) ORDER BY row_id DESC LIMIT 100").map_err(|error| error.to_string())?;

    let rows = statement
        .query_map(
            params![
                query.topic_id,
                query.before,
                query.unread_only,
                query.search
            ],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, bool>(2)?,
                    row.get::<_, String>(3)?,
                ))
            },
        )
        .map_err(|error| error.to_string())?;

    rows.map(|row| {
        let (row_id, topic_id, is_read, payload) = row.map_err(|error| error.to_string())?;
        Ok(StoredMessage {
            row_id,
            topic_id,
            is_read,
            message: serde_json::from_str(&payload).map_err(|error| error.to_string())?,
        })
    })
    .collect()
}

pub fn meta(connection: &Connection, key: &str) -> Result<Option<String>, String> {
    connection
        .query_row("SELECT value FROM app_meta WHERE key=?1", [key], |row| {
            row.get(0)
        })
        .optional()
        .map_err(|error| error.to_string())
}

pub fn cleanup(connection: &Connection) -> Result<(), String> {
    connection.execute_batch("DELETE FROM ntfy_messages WHERE row_id NOT IN (SELECT row_id FROM ntfy_messages ORDER BY row_id DESC LIMIT 10000);")
        .map_err(|error| error.to_string())
}
