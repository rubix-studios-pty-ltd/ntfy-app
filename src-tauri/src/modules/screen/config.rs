use crate::db::models::ActionConfig;

pub fn text_config(config: Option<&ActionConfig>, key: &str) -> Option<String> {
    config?
        .get(key)?
        .as_str()
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToOwned::to_owned)
}
