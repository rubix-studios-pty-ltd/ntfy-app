use std::collections::BTreeMap;

use rusqlite::{Connection, OptionalExtension, params};

use crate::db::models::{DayKey, Schedule, ScheduleInput};

use super::{default_schedule_config, schedule_day_row, validate_schedule};

pub fn get_schedule(connection: &Connection) -> Result<Schedule, String> {
    let schedule_enabled = connection
        .query_row(
            "SELECT active FROM schedule WHERE id = 'default'",
            [],
            |row| row.get::<_, i64>("active"),
        )
        .optional()
        .map_err(|error| error.to_string())?
        .unwrap_or(0)
        != 0;

    let mut days = BTreeMap::new();

    for day_key in DayKey::ALL {
        days.insert(day_key, default_schedule_config(day_key));
    }

    let mut statement = connection
        .prepare(
            r#"
            SELECT
                day_key,
                active,
                start_time,
                end_time
            FROM schedule_days
            ORDER BY CASE day_key
                WHEN 'monday' THEN 1
                WHEN 'tuesday' THEN 2
                WHEN 'wednesday' THEN 3
                WHEN 'thursday' THEN 4
                WHEN 'friday' THEN 5
                WHEN 'saturday' THEN 6
                WHEN 'sunday' THEN 7
            END
            "#,
        )
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], schedule_day_row)
        .map_err(|error| error.to_string())?;

    for row in rows {
        let (day_key, config) = row.map_err(|error| error.to_string())?;
        days.insert(day_key, config);
    }

    Ok(Schedule {
        schedule_enabled,
        days,
    })
}

pub fn update_schedule(connection: &Connection, input: ScheduleInput) -> Result<Schedule, String> {
    validate_schedule(&input)?;

    let now = super::now_ms();

    connection
        .execute(
            r#"
            INSERT INTO schedule (
                id,
                active,
                created_at,
                updated_at
            )
            VALUES (
                'default',
                ?1,
                ?2,
                ?2
            )
            ON CONFLICT(id) DO UPDATE SET
                active = excluded.active,
                updated_at = excluded.updated_at
            "#,
            params![i64::from(input.schedule_enabled), now],
        )
        .map_err(|error| error.to_string())?;

    for day_key in DayKey::ALL {
        let config = input
            .days
            .get(&day_key)
            .ok_or_else(|| format!("Schedule is missing {}", day_key.as_str()))?;

        connection
            .execute(
                r#"
                INSERT INTO schedule_days (
                    day_key,
                    active,
                    start_time,
                    end_time,
                    updated_at
                )
                VALUES (?1, ?2, ?3, ?4, ?5)
                ON CONFLICT(day_key) DO UPDATE SET
                    active = excluded.active,
                    start_time = excluded.start_time,
                    end_time = excluded.end_time,
                    updated_at = excluded.updated_at
                "#,
                params![
                    day_key.as_str(),
                    i64::from(config.enabled),
                    config.start_time,
                    config.end_time,
                    now,
                ],
            )
            .map_err(|error| error.to_string())?;
    }

    get_schedule(connection)
}
