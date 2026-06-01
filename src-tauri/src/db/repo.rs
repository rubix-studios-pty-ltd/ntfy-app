use rusqlite::types::Type;
use rusqlite::{Connection, OptionalExtension, Row, params};
use std::time::{SystemTime, UNIX_EPOCH};

use super::models::{ActionConfig, AutomationRule, DayKey, ScheduleConfig, ScheduleInput};

mod automation;
mod logs;
mod schedule;

pub use automation::{
    create_rule, delete_rule, get_rule, list_active_rules, list_rules, toggle_rule, update_rule,
};
pub use logs::{cleanup_logs, list_logs, record_execution};
pub use schedule::{get_schedule, update_schedule};

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

fn parse_day_key(value: &str) -> Result<DayKey, String> {
    match value {
        "monday" => Ok(DayKey::Monday),
        "tuesday" => Ok(DayKey::Tuesday),
        "wednesday" => Ok(DayKey::Wednesday),
        "thursday" => Ok(DayKey::Thursday),
        "friday" => Ok(DayKey::Friday),
        "saturday" => Ok(DayKey::Saturday),
        "sunday" => Ok(DayKey::Sunday),
        _ => Err(format!("Invalid day key: {value}")),
    }
}

fn schedule_day_row(row: &Row<'_>) -> rusqlite::Result<(DayKey, ScheduleConfig)> {
    let day_key: String = row.get("day_key")?;

    let day_key = parse_day_key(&day_key).map_err(|error| {
        rusqlite::Error::FromSqlConversionFailure(
            0,
            Type::Text,
            Box::new(std::io::Error::other(error)),
        )
    })?;

    Ok((
        day_key,
        ScheduleConfig {
            enabled: row.get::<_, i64>("active")? != 0,
            start_time: row.get("start_time")?,
            end_time: row.get("end_time")?,
        },
    ))
}

fn default_schedule_config(day_key: DayKey) -> ScheduleConfig {
    ScheduleConfig {
        enabled: !matches!(day_key, DayKey::Saturday | DayKey::Sunday),
        start_time: "09:00".to_string(),
        end_time: "17:00".to_string(),
    }
}

pub fn time_to_minutes(value: &str) -> Option<u16> {
    let mut parts = value.split(':');

    let hour = parts.next()?.parse::<u16>().ok()?;
    let minute = parts.next()?.parse::<u16>().ok()?;

    if parts.next().is_some() || hour > 23 || minute > 59 {
        return None;
    }

    Some((hour * 60) + minute)
}

fn validate_schedule(input: &ScheduleInput) -> Result<(), String> {
    for day_key in DayKey::ALL {
        let config = input
            .days
            .get(&day_key)
            .ok_or_else(|| format!("Schedule is missing {}", day_key.as_str()))?;

        let start = time_to_minutes(&config.start_time)
            .ok_or_else(|| format!("{} start time is invalid", day_key.as_str()))?;

        let end = time_to_minutes(&config.end_time)
            .ok_or_else(|| format!("{} end time is invalid", day_key.as_str()))?;

        if config.enabled && end <= start {
            return Err(format!(
                "{} end time must be after start time",
                day_key.as_str()
            ));
        }
    }

    Ok(())
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
