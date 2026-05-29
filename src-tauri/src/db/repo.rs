use rusqlite::types::Type;
use rusqlite::{Connection, OptionalExtension, Row, params};
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use super::models::{
    ActionConfig, AutomationInput, AutomationRule, LogsAutomation, LogsInput, LogsList,
};

fn now_ms() -> String {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_millis().to_string())
        .unwrap_or_else(|_| "0".to_string())
}

fn config_row(row: &Row<'_>) -> rusqlite::Result<Option<ActionConfig>> {
    let action_config: Option<String> = row.get("action_config")?;

    match action_config {
        Some(value) => serde_json::from_str::<ActionConfig>(&value)
            .map(Some)
            .map_err(|error| {
                rusqlite::Error::FromSqlConversionFailure(0, Type::Text, Box::new(error))
            }),
        None => Ok(None),
    }
}

fn config_json(action_config: Option<ActionConfig>) -> Result<Option<String>, String> {
    action_config
        .map(|config| serde_json::to_string(&config))
        .transpose()
        .map_err(|error| error.to_string())
}

fn rule_row(row: &Row<'_>) -> rusqlite::Result<AutomationRule> {
    Ok(AutomationRule {
        id: row.get("id")?,
        active: row.get::<_, i64>("active")? != 0,
        name: row.get("name")?,
        topic: row.get("topic")?,
        match_type: row.get("match_type")?,
        match_value: row.get("match_value")?,
        action_type: row.get("action_type")?,
        action_value: row.get("action_value")?,
        module_id: row.get("module_id")?,
        action_config: config_row(row)?,
        arguments: row.get("arguments")?,
        working_directory: row.get("working_directory")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
        last_run: row.get("last_run_at")?,
        status: row.get("status")?,
    })
}

fn rule_id(connection: &Connection, id: &str) -> Result<AutomationRule, String> {
    connection
        .query_row(
            r#"
            SELECT
              id,
              active,
              name,
              topic,
              match_type,
              match_value,
              action_type,
              action_value,
              module_id,
              action_config,
              arguments,
              working_directory,
              created_at,
              updated_at,
              last_run_at,
              status
            FROM automation_rules
            WHERE id = ?1
            "#,
            params![id],
            rule_row,
        )
        .optional()
        .map_err(|error| error.to_string())?
        .ok_or_else(|| "Rule not found".to_string())
}

pub fn list_rules(connection: &Connection) -> Result<Vec<AutomationRule>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT
              id,
              active,
              name,
              topic,
              match_type,
              match_value,
              action_type,
              action_value,
              module_id,
              action_config,
              arguments,
              working_directory,
              created_at,
              updated_at,
              last_run_at,
              status
            FROM automation_rules
            ORDER BY created_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;

    statement
        .query_map([], rule_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn list_active_rules(
    connection: &Connection,
    topic: &str,
) -> Result<Vec<AutomationRule>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT
              id,
              active,
              name,
              topic,
              match_type,
              match_value,
              action_type,
              action_value,
              module_id,
              action_config,
              arguments,
              working_directory,
              created_at,
              updated_at,
              last_run_at,
              status
            FROM automation_rules
            WHERE topic = ?1
              AND active = 1
            ORDER BY created_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;

    statement
        .query_map(params![topic], rule_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn create_rule(
    connection: &Connection,
    rule: AutomationInput,
) -> Result<AutomationRule, String> {
    let now = now_ms();
    let status = rule.status.clone().or_else(|| Some("never".to_string()));
    let action_config = config_json(rule.action_config)?;

    connection
        .execute(
            r#"
            INSERT INTO automation_rules (
              id,
              active,
              name,
              topic,
              match_type,
              match_value,
              action_type,
              action_value,
              module_id,
              action_config,
              arguments,
              working_directory,
              created_at,
              updated_at,
              last_run_at,
              status
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)
            "#,
            params![
                rule.id,
                i64::from(rule.active),
                rule.name,
                rule.topic,
                rule.match_type,
                rule.match_value,
                rule.action_type,
                rule.action_value,
                rule.module_id,
                action_config,
                rule.arguments,
                rule.working_directory,
                now,
                now,
                rule.last_run,
                status,
            ],
        )
        .map_err(|error| error.to_string())?;

    rule_id(connection, &rule.id)
}

pub fn update_rule(
    connection: &Connection,
    rule: AutomationInput,
) -> Result<AutomationRule, String> {
    let now = now_ms();
    let existing = rule_id(connection, &rule.id)?;
    let action_config = config_json(rule.action_config)?;

    connection
        .execute(
            r#"
            UPDATE automation_rules
            SET active = ?2,
                name = ?3,
                topic = ?4,
                match_type = ?5,
                match_value = ?6,
                action_type = ?7,
                action_value = ?8,
                module_id = ?9,
                action_config = ?10,
                arguments = ?11,
                working_directory = ?12,
                updated_at = ?13,
                last_run_at = ?14,
                status = ?15
            WHERE id = ?1
            "#,
            params![
                rule.id,
                i64::from(rule.active),
                rule.name,
                rule.topic,
                rule.match_type,
                rule.match_value,
                rule.action_type,
                rule.action_value,
                rule.module_id,
                action_config,
                rule.arguments,
                rule.working_directory,
                now,
                rule.last_run.or(existing.last_run),
                rule.status.or(existing.status),
            ],
        )
        .map_err(|error| error.to_string())?;

    rule_id(connection, &rule.id)
}

pub fn delete_rule(connection: &Connection, id: &str) -> Result<(), String> {
    let affected = connection
        .execute("DELETE FROM automation_rules WHERE id = ?1", params![id])
        .map_err(|error| error.to_string())?;

    if affected == 0 {
        return Err("Rule not found".to_string());
    }

    Ok(())
}

pub fn toggle_rule(connection: &Connection, id: &str) -> Result<AutomationRule, String> {
    let current = rule_id(connection, id)?;

    let updated = AutomationInput {
        id: current.id.clone(),
        active: !current.active,
        name: current.name,
        topic: current.topic,
        match_type: current.match_type,
        match_value: current.match_value,
        action_type: current.action_type,
        action_value: current.action_value,
        module_id: current.module_id,
        action_config: current.action_config,
        arguments: current.arguments,
        working_directory: current.working_directory,
        last_run: current.last_run,
        status: current.status,
    };

    update_rule(connection, updated)
}

pub fn get_rule(connection: &Connection, id: &str) -> Result<AutomationRule, String> {
    rule_id(connection, id)
}

fn log_row(row: &Row<'_>) -> rusqlite::Result<LogsAutomation> {
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

pub fn test_run(
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
