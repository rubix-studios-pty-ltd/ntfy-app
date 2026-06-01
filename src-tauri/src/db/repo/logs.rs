use rusqlite::{Connection, params};
use uuid::Uuid;

use crate::db::models::{AutomationRule, LogsAutomation, LogsInput, LogsList};

use super::{now_ms, rule_id};

fn log_row(row: &rusqlite::Row<'_>) -> rusqlite::Result<LogsAutomation> {
    Ok(LogsAutomation {
        id: row.get("id")?,
        rule_id: row.get("rule_id")?,
        rule_name: row.get("rule_name")?,
        topic: row.get("topic")?,
        title: row.get("title")?,
        message: row.get("message")?,
        action_type: row.get("action_type")?,
        action_value: row.get("action_value")?,
        module_id: row.get("module_id")?,
        status: row.get("status")?,
        error: row.get("error")?,
        created_at: row.get("created_at")?,
    })
}

pub fn list_logs(connection: &Connection, input: LogsInput) -> Result<LogsList, String> {
    let page = input.page.unwrap_or(1).max(1);
    let page_size = input.page_size.unwrap_or(50).clamp(5, 100);
    let offset = (page - 1) * page_size;

    let limit = i64::from(page_size);
    let offset = i64::from(offset);

    let rule_id = input
        .rule_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty());

    let total = match rule_id {
        Some(rule_id) => connection.query_row(
            "SELECT COUNT(*) FROM automation_logs WHERE rule_id = ?1",
            params![rule_id],
            |row| row.get::<_, u32>(0),
        ),

        None => connection.query_row("SELECT COUNT(*) FROM automation_logs", [], |row| {
            row.get::<_, u32>(0)
        }),
    }
    .map_err(|error| error.to_string())?;

    let items = match rule_id {
        Some(rule_id) => {
            let mut statement = connection
                .prepare(
                    r#"
                    SELECT
                        logs.id,
                        logs.rule_id,
                        logs.rule_name,
                        logs.topic,
                        logs.title,
                        logs.message,
                        logs.action_type,
                        logs.action_value,
                        logs.module_id,
                        logs.status,
                        logs.error,
                        logs.created_at
                    FROM automation_logs logs
                    WHERE logs.rule_id = ?1
                    ORDER BY logs.created_at DESC, logs.id DESC
                    LIMIT ?2 OFFSET ?3
                    "#,
                )
                .map_err(|error| error.to_string())?;

            statement
                .query_map(params![rule_id, limit, offset], log_row)
                .map_err(|error| error.to_string())?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| error.to_string())?
        }

        None => {
            let mut statement = connection
                .prepare(
                    r#"
                    SELECT
                        logs.id,
                        logs.rule_id,
                        logs.rule_name,
                        logs.topic,
                        logs.title,
                        logs.message,
                        logs.action_type,
                        logs.action_value,
                        logs.module_id,
                        logs.status,
                        logs.error,
                        logs.created_at
                    FROM automation_logs logs
                    ORDER BY logs.created_at DESC, logs.id DESC
                    LIMIT ?1 OFFSET ?2
                    "#,
                )
                .map_err(|error| error.to_string())?;

            statement
                .query_map(params![limit, offset], log_row)
                .map_err(|error| error.to_string())?
                .collect::<Result<Vec<_>, _>>()
                .map_err(|error| error.to_string())?
        }
    };

    let total_pages = if total == 0 {
        1
    } else {
        total.div_ceil(page_size)
    };

    Ok(LogsList {
        items,
        page,
        page_size,
        total,
        total_pages,
    })
}

pub fn cleanup_logs(
    connection: &Connection,
    retention_days: u32,
    max_logs: u32,
) -> Result<(), String> {
    let now = now_ms().parse::<i64>().map_err(|error| error.to_string())?;

    let retention_ms = i64::from(retention_days) * 24 * 60 * 60 * 1000;
    let cutoff = now.saturating_sub(retention_ms);

    connection
        .execute(
            r#"
            DELETE FROM automation_logs
            WHERE CAST(created_at AS INTEGER) < ?1
            "#,
            params![cutoff],
        )
        .map_err(|error| error.to_string())?;

    if max_logs > 0 {
        connection
            .execute(
                r#"
                DELETE FROM automation_logs
                WHERE id IN (
                    SELECT id
                    FROM automation_logs
                    ORDER BY CAST(created_at AS INTEGER) DESC, id DESC
                    LIMIT -1 OFFSET ?1
                )
                "#,
                params![i64::from(max_logs)],
            )
            .map_err(|error| error.to_string())?;
    }

    Ok(())
}

pub fn record_execution(
    connection: &Connection,
    rule: &AutomationRule,
    title: Option<String>,
    message: Option<String>,
    status: &str,
    error: Option<String>,
) -> Result<AutomationRule, String> {
    let now = now_ms();
    let log_id = Uuid::new_v4().to_string();

    connection
        .execute(
            r#"
            INSERT INTO automation_logs (
              id,
              rule_id,
              rule_name,
              topic,
              title,
              message,
              action_type,
              action_value,
              module_id,
              status,
              error,
              created_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
            "#,
            params![
                log_id,
                rule.id,
                rule.name,
                rule.topic,
                title,
                message,
                rule.action_type,
                rule.action_value,
                rule.module_id,
                status,
                error,
                now.clone(),
            ],
        )
        .map_err(|error| error.to_string())?;

    connection
        .execute(
            r#"
            UPDATE automation_rules
            SET last_run_at = ?2,
                status = ?3,
                updated_at = ?4
            WHERE id = ?1
            "#,
            params![rule.id, now.clone(), status, now],
        )
        .map_err(|error| error.to_string())?;

    rule_id(connection, &rule.id)
}
