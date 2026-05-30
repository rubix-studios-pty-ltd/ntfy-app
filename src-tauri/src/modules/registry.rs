use super::{screen, sound, system};

use crate::automation::matcher::MatchContext;
use crate::automation::modules::ModuleField;
use crate::db::models::AutomationRule;

type Fields = fn(&str) -> Option<&'static [ModuleField]>;
type Execute = fn(&str, &AutomationRule, &MatchContext) -> Result<(), String>;

struct ModuleHandler {
    fields: Fields,
    execute: Execute,
}

const MODULES: &[ModuleHandler] = &[
    ModuleHandler {
        fields: sound::fields,
        execute: sound::execute,
    },
    ModuleHandler {
        fields: system::fields,
        execute: system::execute,
    },
    ModuleHandler {
        fields: screen::fields,
        execute: screen::execute,
    },
];

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    MODULES.iter().find_map(|module| (module.fields)(module_id))
}

pub fn execute(rule: &AutomationRule, context: &MatchContext) -> Result<(), String> {
    let module_id = rule
        .module_id
        .as_deref()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .ok_or_else(|| "Module is required".to_string())?;

    let module = MODULES
        .iter()
        .find(|module| (module.fields)(module_id).is_some())
        .ok_or_else(|| format!("Unknown module: {module_id}"))?;

    (module.execute)(module_id, rule, context)
}
