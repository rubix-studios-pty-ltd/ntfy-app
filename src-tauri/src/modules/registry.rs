use super::{sound, system};

use crate::automation::matcher::MatchContext;
use crate::automation::modules::ModuleField;
use crate::db::models::AutomationRule;

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    sound::fields(module_id).or_else(|| system::fields(module_id))
}

pub fn execute(rule: &AutomationRule, context: &MatchContext) -> Result<(), String> {
    let module_id = rule
        .module_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Module is required".to_string())?;

    if sound::fields(module_id).is_some() {
        return sound::execute(module_id, rule, context);
    }

    if system::fields(module_id).is_some() {
        return system::execute(module_id, rule, context);
    }

    Err(format!("Unknown module: {module_id}"))
}
