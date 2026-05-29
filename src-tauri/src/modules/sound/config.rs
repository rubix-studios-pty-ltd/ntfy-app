use serde_json::Value;

use crate::automation::executor::replace_tokens;
use crate::automation::matcher::MatchContext;
use crate::db::models::AutomationRule;

pub fn number_config(
    rule: &AutomationRule,
    key: &str,
    context: &MatchContext,
) -> Result<f64, String> {
    let config = rule
        .action_config
        .as_ref()
        .ok_or_else(|| "Module config is required".to_string())?;

    let value = config
        .get(key)
        .ok_or_else(|| format!("Module config is missing {key}"))?;

    let number = match value {
        Value::Number(number) => number
            .as_f64()
            .ok_or_else(|| format!("{key} must be a valid number"))?,

        Value::String(text) => replace_tokens(text, context)
            .trim()
            .parse::<f64>()
            .map_err(|_| format!("{key} must be a number"))?,

        _ => return Err(format!("{key} must be a number")),
    };

    if !number.is_finite() {
        return Err(format!("{key} must be finite"));
    }

    Ok(number)
}
