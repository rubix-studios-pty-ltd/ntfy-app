use crate::automation::modules::{Validation, validate_config};
use crate::db::models::AutomationInput;

use std::path::{Path, PathBuf};
use url::Url;

const ACTION_TYPES: &[&str] = &["runProgram", "runScript", "openUrl", "module"];
const MATCH_TYPES: &[&str] = &["equals", "contains", "startsWith"];
const STATUSES: &[&str] = &["success", "failed", "never"];

pub fn validate_rule(rule: &AutomationInput) -> Result<(), String> {
    required("id", &rule.id)?;
    required("name", &rule.name)?;
    required("topic", &rule.topic)?;
    required("matchValue", &rule.match_value)?;

    validate_match(&rule.match_value)?;

    if !MATCH_TYPES.contains(&rule.match_type.as_str()) {
        return Err("Invalid match type".to_string());
    }

    if !ACTION_TYPES.contains(&rule.action_type.as_str()) {
        return Err("Invalid action type".to_string());
    }

    if let Some(status) = rule.status.as_deref() && !STATUSES.contains(&status) {
        return Err("Invalid status".to_string());
    }

    match rule.action_type.as_str() {
    "runProgram" => {
        let program = required_option("program", &rule.action_value)?;

        validate_program(
            "Program",
            program,
            rule.working_directory.as_deref(),
        )?;
    }

    "runScript" => {
        let script = required_option("script", &rule.action_value)?;

        validate_script(
            "Script",
            script,
            rule.working_directory.as_deref(),
        )?;
    }

        "openUrl" => {
            let url = required_option("url", &rule.action_value)?;
            validate_url(url)?;
        }

        "module" => {
            validate_module(rule)?;
        }

        _ => return Err("Invalid action type".to_string()),
    }

    if let Some(working_directory) = rule.working_directory.as_deref() {
        let working_directory = working_directory.trim();

        if !working_directory.is_empty() && !Path::new(working_directory).is_dir() {
            return Err("Working directory does not exist".to_string());
        }
    }

    Ok(())
}

fn required(field: &str, value: &str) -> Result<(), String> {
    if value.trim().is_empty() {
        return Err(format!("{field} is required"));
    }

    Ok(())
}

fn required_option<'a>(field: &str, value: &'a Option<String>) -> Result<&'a str, String> {
    value
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| format!("{field} is required"))
}

fn validate_match(value: &str) -> Result<(), String> {
    let has_match = value.lines().map(str::trim).any(|line| !line.is_empty());

    if !has_match {
        return Err("Match value cannot be empty".to_string());
    }

    Ok(())
}

fn validate_url(value: &str) -> Result<(), String> {
    let url = Url::parse(value).map_err(|_| "Invalid URL".to_string())?;

    match url.scheme() {
        "http" | "https" => Ok(()),
        _ => Err("Only http and https URLs are allowed".to_string()),
    }
}

fn validate_module(rule: &AutomationInput) -> Result<(), String> {
    let module_id = required_option("module", &rule.module_id)?;

    let config = rule
        .action_config
        .as_ref()
        .ok_or_else(|| "Module config is required".to_string())?;

    validate_config(module_id, config, Validation::Save)
}

fn validate_program(
    field: &str,
    value: &str,
    working_directory: Option<&str>,
) -> Result<(), String> {
    let value = value.trim();

    if value.is_empty() {
        return Err(format!("{field} is required"));
    }

    let path = PathBuf::from(value);

    if path.is_absolute() {
        return validate_file(field, &path);
    }

    let has_path_separator = value.contains('/') || value.contains('\\');

    if let Some(directory) = working_directory
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let resolved = Path::new(directory).join(&path);
        return validate_file(field, &resolved);
    }

    if has_path_separator {
        return Err(format!(
            "{field} uses a relative path, so a working directory is required"
        ));
    }

    // Bare command is allowed so the OS/PATH can resolve it later.
    Ok(())
}

fn validate_script(
    field: &str,
    value: &str,
    working_directory: Option<&str>,
) -> Result<(), String> {
    let value = value.trim();

    if value.is_empty() {
        return Err(format!("{field} is required"));
    }

    let path = PathBuf::from(value);

    let resolved = if path.is_absolute() {
        path
    } else if let Some(directory) = working_directory
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        Path::new(directory).join(path)
    } else {
        return Err(format!(
            "{field} must use an absolute path or have a working directory"
        ));
    };

    validate_file(field, &resolved)?;
    validate_ext(field, &resolved)?;

    Ok(())
}

fn validate_file(field: &str, path: &Path) -> Result<(), String> {
    if !path.exists() {
        return Err(format!("{field} path does not exist: {}", path.display()));
    }

    if !path.is_file() {
        return Err(format!("{field} path is not a file: {}", path.display()));
    }

    Ok(())
}

fn validate_ext(field: &str, path: &Path) -> Result<(), String> {
    let extension = path
        .extension()
        .and_then(|value| value.to_str())
        .map(str::to_ascii_lowercase)
        .ok_or_else(|| format!("{field} must have a valid extension"))?;

    match extension.as_str() {
        "bat" | "cmd" | "ps1" | "sh" => Ok(()),
        _ => Err(format!("{field} has an unsupported extension")),
    }
}