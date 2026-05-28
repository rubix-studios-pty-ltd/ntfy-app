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
    same_text(incoming, line).then(|| incoming.to_string())
}

fn match_starts_with(incoming: &str, line: &str) -> Option<String> {
    let end = ascii_prefix_end(incoming, line)?;

    Some(incoming[end..].trim().to_string())
}

fn match_contains(incoming: &str, line: &str) -> Option<String> {
    let (start, end) = ascii_find(incoming, line)?;

    let before = incoming[..start].trim();
    let after = incoming[end..].trim();

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

fn ascii_find(incoming: &str, needle: &str) -> Option<(usize, usize)> {
    for (start, _) in incoming.char_indices() {
        if let Some(end) = ascii_prefix_end(&incoming[start..], needle) {
            return Some((start, start + end));
        }
    }

    None
}

fn ascii_prefix_end(incoming: &str, needle: &str) -> Option<usize> {
    let mut incoming_chars = incoming.char_indices();

    for needle_char in needle.chars() {
        let (_, incoming_char) = incoming_chars.next()?;

        if !same_ascii_char(incoming_char, needle_char) {
            return None;
        }
    }

    Some(
        incoming_chars
            .next()
            .map(|(index, _)| index)
            .unwrap_or(incoming.len()),
    )
}

fn same_ascii_char(left: char, right: char) -> bool {
    left.to_ascii_lowercase() == right.to_ascii_lowercase()
}