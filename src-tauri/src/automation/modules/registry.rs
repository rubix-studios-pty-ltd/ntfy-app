#[path = "sound.rs"]
mod sound;

use super::ModuleField;

pub(super) fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    sound::fields(module_id)
}
