use rusqlite::{Connection, params};
use std::collections::HashSet;

use crate::db::models::HotkeySettings;

pub fn get_hotkeys(connection: &Connection) -> Result<HotkeySettings, String> {
    let mut settings = HotkeySettings {
        next_topic: "Tab".to_string(),
        delete_notifications: "Ctrl+Shift+D".to_string(),
        publish: "Ctrl+Shift+P".to_string(),
        mark_all_read: "Ctrl+Shift+R".to_string(),
        reconnect: "Ctrl+Shift+E".to_string(),
    };

    let mut statement = connection
        .prepare("SELECT action, shortcut FROM ntfy_hotkeys")
        .map_err(|error| error.to_string())?;

    let rows = statement
        .query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
        })
        .map_err(|error| error.to_string())?;

    for row in rows {
        let (action, shortcut) = row.map_err(|error| error.to_string())?;
        match action.as_str() {
            "next_topic" => settings.next_topic = shortcut,
            "delete_notifications" => settings.delete_notifications = shortcut,
            "publish" => settings.publish = shortcut,
            "mark_all_read" => settings.mark_all_read = shortcut,
            "reconnect" => settings.reconnect = shortcut,
            _ => {}
        }
    }

    Ok(settings)
}

pub fn update_hotkeys(
    connection: &Connection,
    input: HotkeySettings,
) -> Result<HotkeySettings, String> {
    let next_topic = canonical(&input.next_topic)?;
    let delete_notifications = canonical(&input.delete_notifications)?;
    let publish = canonical(&input.publish)?;
    let mark_all_read = canonical(&input.mark_all_read)?;
    let reconnect = canonical(&input.reconnect)?;

    if next_topic != "Tab" && !has_command_modifier(&next_topic) {
        return Err("Next topic requires Ctrl, Alt or Meta, unless assigned to Tab".to_string());
    }

    if [&delete_notifications, &publish, &mark_all_read, &reconnect]
        .iter()
        .any(|shortcut| !has_command_modifier(shortcut))
    {
        return Err("Actions other than Next topic require Ctrl, Alt or Meta".to_string());
    }

    let shortcuts = [
        &next_topic,
        &delete_notifications,
        &publish,
        &mark_all_read,
        &reconnect,
    ];

    if shortcuts.iter().copied().collect::<HashSet<_>>().len() != shortcuts.len() {
        return Err("Each action must have a different shortcut".to_string());
    }

    let transaction = connection
        .unchecked_transaction()
        .map_err(|error| error.to_string())?;

    for (action, shortcut) in [
        ("next_topic", &next_topic),
        ("delete_notifications", &delete_notifications),
        ("publish", &publish),
        ("mark_all_read", &mark_all_read),
        ("reconnect", &reconnect),
    ] {
        transaction
            .execute(
                "INSERT INTO ntfy_hotkeys(action, shortcut) VALUES (?1, ?2)
                 ON CONFLICT(action) DO UPDATE SET shortcut = excluded.shortcut",
                params![action, shortcut],
            )
            .map_err(|error| error.to_string())?;
    }

    transaction.commit().map_err(|error| error.to_string())?;
    get_hotkeys(connection)
}

fn has_command_modifier(shortcut: &str) -> bool {
    shortcut
        .split('+')
        .any(|part| matches!(part, "Ctrl" | "Alt" | "Meta"))
}

fn canonical(value: &str) -> Result<String, String> {
    let mut ctrl = false;
    let mut alt = false;
    let mut shift = false;
    let mut meta = false;
    let mut key = None;

    for part in value.split('+') {
        match part {
            "Ctrl" if !ctrl => ctrl = true,
            "Alt" if !alt => alt = true,
            "Shift" if !shift => shift = true,
            "Meta" if !meta => meta = true,
            "Ctrl" | "Alt" | "Shift" | "Meta" => {
                return Err("Duplicate modifier in shortcut".to_string());
            }
            candidate if key.is_none() && valid_key(candidate) => key = Some(candidate),
            _ => return Err("Invalid shortcut key combination".to_string()),
        }
    }

    let key = key.ok_or_else(|| "Shortcut must include a key".to_string())?;
    let mut parts = Vec::with_capacity(5);

    if ctrl {
        parts.push("Ctrl");
    }
    if alt {
        parts.push("Alt");
    }
    if shift {
        parts.push("Shift");
    }
    if meta {
        parts.push("Meta");
    }
    parts.push(key);
    Ok(parts.join("+"))
}

fn valid_key(key: &str) -> bool {
    matches!(
        key,
        "Tab" | "Enter" | "Space" | "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"
    ) || (key.len() == 1
        && key
            .bytes()
            .all(|byte| byte.is_ascii_uppercase() || byte.is_ascii_digit()))
        || matches!(
            key,
            "F1" | "F2" | "F3" | "F4" | "F5" | "F6" | "F7" | "F8" | "F9" | "F10" | "F11" | "F12"
        )
}
