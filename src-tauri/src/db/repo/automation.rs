use rusqlite::{Connection, params};

use super::{config_json, rule_id, rule_row};
use crate::db::models::{AutomationInput, AutomationRule};

pub fn get_rule(connection: &Connection, id: &str) -> Result<AutomationRule, String> {
    rule_id(connection, id)
}

pub fn get_rules(connection: &Connection) -> Result<Vec<AutomationRule>, String> {
    let mut statement = connection
        .prepare(
            r#"
            SELECT
              id,
              active,
              name,
              topic,
              server_id,
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

pub fn get_active_rules(
    connection: &Connection,
    server_id: &str,
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
              server_id,
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
            WHERE server_id = ?1
                AND topic = ?2 COLLATE NOCASE
                AND active = 1
            ORDER BY created_at DESC
            "#,
        )
        .map_err(|error| error.to_string())?;

    statement
        .query_map(params![server_id, topic], rule_row)
        .map_err(|error| error.to_string())?
        .collect::<Result<Vec<_>, _>>()
        .map_err(|error| error.to_string())
}

pub fn create_rule(
    connection: &Connection,
    rule: AutomationInput,
) -> Result<AutomationRule, String> {
    let now = super::now_ms();
    let status = rule.status.clone().or_else(|| Some("never".to_string()));
    let action_config = config_json(rule.action_config)?;

    verify_server(connection, &rule.server_id)?;

    connection
        .execute(
            r#"
            INSERT INTO automation_rules (
              id,
              active,
              name,
              topic,
              server_id,
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
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17)
            "#,
            params![
                rule.id,
                i64::from(rule.active),
                rule.name,
                rule.topic,
                rule.server_id,
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
    let now = super::now_ms();
    let existing = rule_id(connection, &rule.id)?;
    let action_config = config_json(rule.action_config)?;
    verify_server(connection, &rule.server_id)?;

    connection
        .execute(
            r#"
            UPDATE automation_rules
            SET active = ?2,
                name = ?3,
                topic = ?4,
                server_id = ?5,
                match_type = ?6,
                match_value = ?7,
                action_type = ?8,
                action_value = ?9,
                module_id = ?10,
                action_config = ?11,
                arguments = ?12,
                working_directory = ?13,
                updated_at = ?14,
                last_run_at = ?15,
                status = ?16
            WHERE id = ?1
            "#,
            params![
                rule.id,
                i64::from(rule.active),
                rule.name,
                rule.topic,
                rule.server_id,
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
        server_id: current.server_id,
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

fn verify_server(connection: &Connection, server_id: &str) -> Result<(), String> {
    if server_id.is_empty() {
        return Err("Choose a server for this automation".to_string());
    }

    let found: i64 = connection
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM ntfy_servers WHERE id=?1 AND enabled=1)",
            [server_id],
            |row| row.get(0),
        )
        .map_err(|error| error.to_string())?;

    if found == 0 {
        return Err("The selected server is unavailable".to_string());
    }

    Ok(())
}
