use std::{
    fs,
    path::{Path, PathBuf},
};

use chrono::Local;
use xcap::Monitor;

use crate::automation::matcher::MatchContext;
use crate::automation::modules::{FieldKind, ModuleField};
use crate::automation::tokens::replace_tokens;
use crate::db::models::{ActionConfig, AutomationRule};

const FIELDS: &[ModuleField] = &[
    ModuleField {
        key: "directory",
        kind: FieldKind::Text,
        min: None,
        max: None,
        allow_variables: true,
        options: &[],
    },
    ModuleField {
        key: "filename",
        kind: FieldKind::Text,
        min: None,
        max: None,
        allow_variables: true,
        options: &[],
    },
];

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "takeScreenshot" => Some(FIELDS),
        _ => None,
    }
}

pub fn execute(
    module_id: &str,
    rule: &AutomationRule,
    context: &MatchContext,
) -> Result<(), String> {
    match module_id {
        "takeScreenshot" => take_screenshot(rule.action_config.as_ref(), context),
        _ => Err(format!("Unknown screen module: {module_id}")),
    }
}

fn take_screenshot(config: Option<&ActionConfig>, context: &MatchContext) -> Result<(), String> {
    let directory = text_config(config, "directory")
        .map(|value| replace_tokens(&value, context))
        .filter(|value| !value.trim().is_empty())
        .map(PathBuf::from)
        .unwrap_or_else(default_directory);

    fs::create_dir_all(&directory)
        .map_err(|error| format!("Failed to create screenshot directory: {error}"))?;

    let filename = text_config(config, "filename")
        .map(|value| replace_tokens(&value, context))
        .filter(|value| !value.trim().is_empty())
        .unwrap_or_else(default_filename);

    let path = unique_path(&directory, filename);

    let monitor = primary_monitor()?;

    let image = monitor
        .capture_image()
        .map_err(|error| format!("Failed to capture screenshot: {error}"))?;

    image
        .save(&path)
        .map_err(|error| format!("Failed to save screenshot: {error}"))?;

    Ok(())
}

fn primary_monitor() -> Result<Monitor, String> {
    let monitors = Monitor::all().map_err(|error| format!("Failed to list monitors: {error}"))?;

    if monitors.is_empty() {
        return Err("No monitors found".to_string());
    }

    let mut fallback = None;

    for monitor in monitors {
        if fallback.is_none() {
            fallback = Some(monitor.clone());
        }

        if monitor.is_primary().unwrap_or(false) {
            return Ok(monitor);
        }
    }

    fallback.ok_or_else(|| "No monitor available".to_string())
}

fn text_config(config: Option<&ActionConfig>, key: &str) -> Option<String> {
    config?
        .get(key)?
        .as_str()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}

fn default_directory() -> PathBuf {
    home_directory()
        .map(|home| home.join("Pictures").join("Ntfy App").join("Screenshots"))
        .unwrap_or_else(|| PathBuf::from("screenshots"))
}

fn home_directory() -> Option<PathBuf> {
    std::env::var_os("HOME")
        .or_else(|| std::env::var_os("USERPROFILE"))
        .map(PathBuf::from)
}

fn default_filename() -> String {
    format!("sc-{}.png", Local::now().format("%Y%m%d-%H%M%S-%3f"))
}

fn unique_path(directory: &Path, filename: String) -> PathBuf {
    let mut filename = sanitize_filename::sanitize(filename.trim());

    if filename.is_empty() {
        filename = default_filename();
    }

    let filename = png_extension(filename);
    let initial_path = directory.join(&filename);

    if !initial_path.exists() {
        return initial_path;
    }

    let stem = Path::new(&filename)
        .file_stem()
        .and_then(|value| value.to_str())
        .unwrap_or("screenshot");

    for index in 2.. {
        let candidate = directory.join(format!("{stem}-{index}.png"));

        if !candidate.exists() {
            return candidate;
        }
    }

    unreachable!("File name should always be unique")
}

fn png_extension(filename: String) -> String {
    let mut path = PathBuf::from(filename);
    path.set_extension("png");

    path.file_name()
        .and_then(|value| value.to_str())
        .map(ToOwned::to_owned)
        .unwrap_or_else(default_filename)
}
