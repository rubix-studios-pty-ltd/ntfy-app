use crate::db::models::AutomationRule;

#[derive(Debug, Clone)]
pub struct AutomationEvent {
    pub topic: String,
    pub title: Option<String>,
    pub message: String,
}

#[derive(Debug, Clone)]
pub struct MatchContext {
    pub value: String,
    pub matched_line: String,
    pub message: String,
}

pub fn match_rule(rule: &AutomationRule, event: &AutomationEvent) -> Option<MatchContext> {
    if !same_text(&rule.topic, &event.topic) {
        return None;
    }

    let incoming = event.message.trim();

    if incoming.is_empty() {
        return None;
    }

    for line in rule
        .match_value
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let value = match rule.match_type.as_str() {
            "equals" => match_equals(incoming, line),
            "contains" => match_contains(incoming, line),
            "startsWith" => match_starts_with(incoming, line),
            _ => None,
        };

        if let Some(value) = value {
            return Some(MatchContext {
                value,
                matched_line: line.to_string(),
                message: incoming.to_string(),
            });
        }
    }

    None
}

fn match_equals(incoming: &str, line: &str) -> Option<String> {
    if same_text(incoming, line) {
        return Some(incoming.to_string());
    }

    None
}

fn match_starts_with(incoming: &str, line: &str) -> Option<String> {
    let incoming_normalized = incoming.to_ascii_lowercase();
    let line_normalized = line.to_ascii_lowercase();

    if !incoming_normalized.starts_with(&line_normalized) {
        return None;
    }

    let value = incoming
        .get(line.len()..)
        .unwrap_or_default()
        .trim()
        .to_string();

    Some(value)
}

fn match_contains(incoming: &str, line: &str) -> Option<String> {
    let incoming_normalized = incoming.to_ascii_lowercase();
    let line_normalized = line.to_ascii_lowercase();

    let index = incoming_normalized.find(&line_normalized)?;

    let start = index;
    let end = index + line.len();

    let before = incoming.get(..start).unwrap_or_default().trim();
    let after = incoming.get(end..).unwrap_or_default().trim();

    let value = if after.is_empty() {
        before.to_string()
    } else {
        after.to_string()
    };

    Some(value)
}

fn same_text(left: &str, right: &str) -> bool {
    left.trim().eq_ignore_ascii_case(right.trim())
}
