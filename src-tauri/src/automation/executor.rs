use std::process::Command;
use tauri::AppHandle;

use crate::automation::matcher::MatchContext;
use crate::db::models::AutomationRule;

pub async fn execute_rule(
    app: &AppHandle,
    rule: &AutomationRule,
    context: &MatchContext,
) -> Result<(), String> {
    match rule.action_type.as_str() {
        "openUrl" => open_url(app, rule),
        "runProgram" => run_program(rule, context),
        "module" => crate::automation::modules::execute(rule, context),
        _ => Err("Invalid action type".to_string()),
    }
}

fn open_url(app: &AppHandle, rule: &AutomationRule) -> Result<(), String> {
    let url = rule
        .action_value
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "URL is required".to_string())?;

    tauri_plugin_opener::OpenerExt::opener(app)
        .open_url(url, None::<&str>)
        .map_err(|error| error.to_string())
}

fn run_program(rule: &AutomationRule, context: &MatchContext) -> Result<(), String> {
    let program = rule
        .action_value
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Program is required".to_string())?;

    let mut command = Command::new(program);

    if let Some(args) = rule.arguments.as_deref() {
        for arg in args.split_whitespace() {
            command.arg(replace_tokens(arg, context));
        }
    }

    if let Some(directory) = rule.working_directory.as_deref() {
        let directory = directory.trim();

        if !directory.is_empty() {
            command.current_dir(directory);
        }
    }

    command.spawn().map_err(|error| error.to_string())?;

    Ok(())
}

fn replace_tokens(value: &str, context: &MatchContext) -> String {
    value
        .replace("$value", &context.value)
        .replace("$message", &context.message)
        .replace("$matchedLine", &context.matched_line)
}
