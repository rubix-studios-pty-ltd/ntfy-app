use super::super::{FieldKind, ModuleField};

const SET_VOLUME_FIELDS: &[ModuleField] = &[ModuleField {
    key: "volume",
    kind: FieldKind::Number,
    min: Some(0.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const INCREASE_VOLUME_FIELDS: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const DECREASE_VOLUME_FIELDS: &[ModuleField] = &[ModuleField {
    key: "amount",
    kind: FieldKind::Number,
    min: Some(1.0),
    max: Some(100.0),
    allow_variables: true,
    options: &[],
}];

const MUTE_TOGGLE_FIELDS: &[ModuleField] = &[];

pub(super) fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "volSet" => Some(SET_VOLUME_FIELDS),
        "volInc" => Some(INCREASE_VOLUME_FIELDS),
        "volDown" => Some(DECREASE_VOLUME_FIELDS),
        "volMute" => Some(MUTE_TOGGLE_FIELDS),
        _ => None,
    }
}
