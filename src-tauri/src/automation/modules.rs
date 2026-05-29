use serde_json::Value;

use crate::automation::matcher::MatchContext;
use crate::db::models::{ActionConfig, AutomationRule};
use crate::modules::registry;

#[derive(Clone, Copy)]
pub enum Validation {
    Save,
    #[allow(dead_code)]
    Execute,
}

#[derive(Clone, Copy)]
pub enum FieldKind {
    Number,
    #[allow(dead_code)]
    Boolean,
    #[allow(dead_code)]
    Text,
    #[allow(dead_code)]
    Select,
}

pub struct ModuleField {
    pub key: &'static str,
    pub kind: FieldKind,
    pub min: Option<f64>,
    pub max: Option<f64>,
    pub allow_variables: bool,
    pub options: &'static [&'static str],
}

pub fn execute(rule: &AutomationRule, context: &MatchContext) -> Result<(), String> {
    registry::execute(rule, context)
}

pub fn validate_config(
    module_id: &str,
    config: &ActionConfig,
    mode: Validation,
) -> Result<(), String> {
    let fields =
        registry::fields(module_id).ok_or_else(|| format!("Unknown module: {module_id}"))?;

    for key in config.keys() {
        if !fields.iter().any(|field| field.key == key) {
            return Err(format!("{module_id} has unknown config field: {key}"));
        }
    }

    for field in fields {
        let value = config
            .get(field.key)
            .ok_or_else(|| format!("{module_id} is missing config field: {}", field.key))?;

        validate_field(module_id, field, value, mode)?;
    }

    Ok(())
}

fn validate_field(
    module_id: &str,
    field: &ModuleField,
    value: &Value,
    mode: Validation,
) -> Result<(), String> {
    match field.kind {
        FieldKind::Number => validate_number(module_id, field, value, mode),
        FieldKind::Boolean => validate_boolean(module_id, field, value),
        FieldKind::Text => validate_text(module_id, field, value, mode),
        FieldKind::Select => validate_select(module_id, field, value, mode),
    }
}

fn validate_number(
    module_id: &str,
    field: &ModuleField,
    value: &Value,
    mode: Validation,
) -> Result<(), String> {
    let number = match value {
        Value::Number(number) => number
            .as_f64()
            .ok_or_else(|| format!("{module_id}.{} must be a valid number", field.key))?,

        Value::String(text) => {
            let text = text.trim();

            if text.contains("$value") {
                if field.allow_variables && matches!(mode, Validation::Save) {
                    return Ok(());
                }

                return Err(format!(
                    "{module_id}.{} cannot contain unresolved variables during execution",
                    field.key
                ));
            }

            text.parse::<f64>()
                .map_err(|_| format!("{module_id}.{} must be a number", field.key))?
        }

        _ => return Err(format!("{module_id}.{} must be a number", field.key)),
    };

    if !number.is_finite() {
        return Err(format!("{module_id}.{} must be finite", field.key));
    }

    if let Some(min) = field.min
        && number < min
    {
        return Err(format!("{module_id}.{} must be at least {min}", field.key));
    }

    if let Some(max) = field.max
        && number > max
    {
        return Err(format!("{module_id}.{} must be at most {max}", field.key));
    }

    Ok(())
}

fn validate_boolean(module_id: &str, field: &ModuleField, value: &Value) -> Result<(), String> {
    match value {
        Value::Bool(_) => Ok(()),
        Value::String(text) if text == "true" || text == "false" => Ok(()),
        _ => Err(format!("{module_id}.{} must be true or false", field.key)),
    }
}

fn validate_text(
    module_id: &str,
    field: &ModuleField,
    value: &Value,
    mode: Validation,
) -> Result<(), String> {
    let Value::String(text) = value else {
        return Err(format!("{module_id}.{} must be text", field.key));
    };

    if text.contains("$value") && (!field.allow_variables || matches!(mode, Validation::Execute)) {
        return Err(format!(
            "{module_id}.{} contains an invalid variable",
            field.key
        ));
    }

    Ok(())
}

fn validate_select(
    module_id: &str,
    field: &ModuleField,
    value: &Value,
    mode: Validation,
) -> Result<(), String> {
    let Value::String(text) = value else {
        return Err(format!("{module_id}.{} must be a valid option", field.key));
    };

    if text.contains("$value") {
        if field.allow_variables && matches!(mode, Validation::Save) {
            return Ok(());
        }

        return Err(format!(
            "{module_id}.{} contains an invalid variable",
            field.key
        ));
    }

    if !field.options.contains(&text.as_str()) {
        return Err(format!("{module_id}.{} is not a valid option", field.key));
    }

    Ok(())
}
