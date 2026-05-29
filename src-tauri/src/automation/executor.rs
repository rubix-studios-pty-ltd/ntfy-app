use std::process::Command;
use tauri::AppHandle;

use crate::automation::matcher::MatchContext;
use crate::automation::modules;
use crate::db::models::AutomationRule;

pub async fn execute_rule(
    app: &AppHandle,
    rule: &AutomationRule,
    context: &MatchContext,
) -> Result<(), String> {
    match rule.action_type.as_str() {
        "openUrl" => open_url(app, rule),
        "runProgram" => run_program(rule, context),
        "module" => modules::execute(rule, context),
        _ => Err("Invalid action type".to_string()),
    }
}

pub fn replace_tokens(value: &str, context: &MatchContext) -> String {
    value
        .replace("$value", &context.value)
        .replace("$message", &context.message)
        .replace("$matchedLine", &context.matched_line)
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

    if let Some(arguments) = rule
        .arguments
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
    {
        let args = parse_arguments(arguments)?;

        for arg in args {
            command.arg(replace_tokens(&arg, context));
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

fn parse_arguments(input: &str) -> Result<Vec<String>, String> {
    let mut args = Vec::new();
    let mut current = String::new();
    let mut quote: Option<char> = None;
    let mut in_arg = false;
    let mut chars = input.chars().peekable();

    while let Some(char) = chars.next() {
        match char {
            '"' | '\'' => {
                in_arg = true;

                if quote == Some(char) {
                    quote = None;
                } else if quote.is_none() {
                    quote = Some(char);
                } else {
                    current.push(char);
                }
            }

            '\\' => {
                in_arg = true;

                if let Some(active_quote) = quote {
                    if chars.peek() == Some(&active_quote) {
                        current.push(active_quote);
                        chars.next();
                    } else {
                        current.push(char);
                    }
                } else {
                    current.push(char);
                }
            }

            char if char.is_whitespace() && quote.is_none() => {
                if in_arg {
                    args.push(std::mem::take(&mut current));
                    in_arg = false;
                }
            }

            char => {
                in_arg = true;
                current.push(char);
            }
        }
    }

    if let Some(quote) = quote {
        return Err(format!("Unclosed quote: {quote}"));
    }

    if in_arg {
        args.push(current);
    }

    Ok(args)
}
