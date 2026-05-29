use crate::automation::matcher::MatchContext;
use crate::automation::modules::{FieldKind, ModuleField};
use crate::db::models::AutomationRule;

mod config;
mod system;

const SET_VOLUME: &[ModuleField] = &[ModuleField {
    key: "volume",
    kind: FieldKind::Number,
    min: Some(0.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const INCREASE_VOLUME: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const DECREASE_VOLUME: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const TOGGLE_MUTE: &[ModuleField] = &[];

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "setVolume" => Some(SET_VOLUME),
        "increaseVolume" => Some(INCREASE_VOLUME),
        "decreaseVolume" => Some(DECREASE_VOLUME),
        "toggleMute" => Some(TOGGLE_MUTE),
        _ => None,
    }
}

pub fn execute(
    module_id: &str,
    rule: &AutomationRule,
    context: &MatchContext,
) -> Result<(), String> {
    match module_id {
        "setVolume" => {
            let volume = config::number_config(rule, "volume", context)?;
            system::set_volume(volume)
        }
        "increaseVolume" => {
            let amount = config::number_config(rule, "amount", context)?;
            system::increase_volume(amount)
        }
        "decreaseVolume" => {
            let amount = config::number_config(rule, "amount", context)?;
            system::decrease_volume(amount)
        }
        "toggleMute" => system::toggle_mute(),

        _ => Err(format!("Unknown sound module: {module_id}")),
    }
}
