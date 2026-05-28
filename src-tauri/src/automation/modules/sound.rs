use super::super::{FieldKind, ModuleField};

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

pub(super) fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "setVolume" => Some(SET_VOLUME),
        "increaseVolume" => Some(INCREASE_VOLUME),
        "decreaseVolume" => Some(DECREASE_VOLUME),
        "toggleMute" => Some(TOGGLE_MUTE),
        _ => None,
    }
}
