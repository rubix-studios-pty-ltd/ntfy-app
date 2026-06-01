use rusqlite::{Connection, params};

use crate::db::models::{AutomationInput, AutomationRule};

use super::{config_json, rule_id, rule_row};

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
    let now = super::now_ms();
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
    let now = super::now_ms();
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
