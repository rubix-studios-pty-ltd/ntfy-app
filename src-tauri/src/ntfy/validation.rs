pub fn validate_display(display_name: &str, icon: &str) -> Result<(String, String), String> {
    let display_name = display_name.trim();

    if display_name.chars().count() > 60 || display_name.chars().any(char::is_control) {
        return Err(
            "Display name must contain at most 60 characters without control characters"
                .to_string(),
        );
    }

    if !matches!(
        icon,
        "bell"
            | "activity"
            | "shield-check"
            | "server"
            | "database"
            | "cloud"
            | "wifi"
            | "monitor"
            | "mail"
            | "globe"
            | "cpu"
            | "hard-drive"
            | "terminal"
            | "house"
            | "webhook"
            | "triangle-alert"
    ) {
        return Err("Choose a valid topic icon".to_string());
    }

    Ok((display_name.to_string(), icon.to_string()))
}
