use crate::db::models::AutomationRule;

#[derive(Debug, Clone)]
pub struct AutomationEvent {
    pub topic: String,
    pub title: Option<String>,
    pub message: String,
    pub priority: u8,
}

#[derive(Debug, Clone)]
pub struct MatchContext {
    pub value: String,
    pub matched_line: String,
    pub message: String,
}

fn incoming_message(incoming: &str) -> Vec<&str> {
    let mut message = Vec::new();

    message.push(incoming);

    for line in incoming
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
    {
        let already_added = message.iter().any(|msg| same_text(msg, line));

        if !already_added {
            message.push(line);
        }
    }

    message
}

pub fn match_rule(rule: &AutomationRule, event: &AutomationEvent) -> Option<MatchContext> {
    if !same_text(&rule.topic, &event.topic) {
        return None;
    }

    if rule.match_type == "priority" {
        return rule
            .match_value
            .split([',', '\n'])
            .map(str::trim)
            .filter(|value| !value.is_empty())
            .find(|value| priority_matches(value, event.priority))
            .map(|value| MatchContext {
                value: event.priority.to_string(),
                matched_line: value.to_string(),
                message: event.message.clone(),
            });
    }

    let incoming = event.message.trim();

    if incoming.is_empty() {
        return None;
    }

    let rules: Vec<&str> = rule
        .match_value
        .lines()
        .map(str::trim)
        .filter(|line| !line.is_empty())
        .collect();

    if rules.is_empty() {
        return None;
    }

    for msg in incoming_message(incoming) {
        for line in &rules {
            let value = match rule.match_type.as_str() {
                "equals" => match_equals(msg, line),
                "contains" => match_contains(msg, line),
                "startsWith" => match_starts_with(msg, line),
                "regex" => match_regex(msg, line),
                _ => None,
            };

            if let Some(value) = value {
                return Some(MatchContext {
                    value,
                    matched_line: (*line).to_string(),
                    message: msg.to_string(),
                });
            }
        }
    }

    None
}

fn match_equals(incoming: &str, line: &str) -> Option<String> {
    if line.contains("$value") {
        return match_template(incoming, line);
    }

    same_text(incoming, line).then(|| incoming.to_string())
}

fn match_starts_with(incoming: &str, line: &str) -> Option<String> {
    if line.contains("$value") {
        return template_starts_with(incoming, line);
    }

    let end = ascii_prefix_end(incoming, line)?;
    let value = incoming[end..].trim();

    if value.is_empty() {
        return Some(String::new());
    }

    Some(value.to_string())
}

fn match_contains(incoming: &str, line: &str) -> Option<String> {
    if line.contains("$value") {
        return template_contains(incoming, line);
    }

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

fn match_template(incoming: &str, template: &str) -> Option<String> {
    let mut parts = template.split("$value");

    let prefix = parts.next()?.trim();
    let suffix = parts.next()?.trim();

    if parts.next().is_some() {
        return None;
    }

    let mut start = if prefix.is_empty() {
        0
    } else {
        ascii_prefix_end(incoming, prefix)?
    };

    while start < incoming.len() {
        let next_char = incoming[start..].chars().next()?;

        if !next_char.is_whitespace() {
            break;
        }

        start += next_char.len_utf8();
    }

    let end = if suffix.is_empty() {
        incoming.len()
    } else {
        start + ascii_suffix_start(&incoming[start..], suffix)?
    };

    let value = incoming[start..end].trim();

    if value.is_empty() {
        return None;
    }

    Some(value.to_string())
}

fn template_starts_with(incoming: &str, template: &str) -> Option<String> {
    match_template(incoming, template)
}

fn template_contains(incoming: &str, template: &str) -> Option<String> {
    for (start, _) in incoming.char_indices() {
        let msg = &incoming[start..];

        if let Some(value) = match_template(msg, template) {
            return Some(value);
        }
    }

    None
}

fn ascii_find(incoming: &str, needle: &str) -> Option<(usize, usize)> {
    for (start, _) in incoming.char_indices() {
        if let Some(end) = ascii_prefix_end(&incoming[start..], needle) {
            return Some((start, start + end));
        }
    }

    None
}

fn ascii_suffix_start(incoming: &str, suffix: &str) -> Option<usize> {
    if suffix.is_empty() {
        return Some(incoming.len());
    }

    for (start, _) in incoming.char_indices() {
        if same_text(&incoming[start..], suffix) {
            return Some(start);
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
    left.eq_ignore_ascii_case(&right)
}

fn match_regex(message: &str, pattern: &str) -> Option<String> {
    let re = regex::Regex::new(pattern).ok()?;
    let captures = re.captures(message)?;
    let capture = captures
        .name("value")
        .or_else(|| captures.get(1))
        .or_else(|| captures.get(0))?;
    Some(capture.as_str().to_string())
}

pub fn valid_priority_expression(value: &str) -> bool {
    let (_, number) = priority_parts(value);
    number
        .parse::<u8>()
        .is_ok_and(|number| (1..=5).contains(&number))
}

fn priority_parts(value: &str) -> (&str, &str) {
    for operator in [">=", "<=", ">", "<", "="] {
        if let Some(number) = value.strip_prefix(operator) {
            return (operator, number.trim());
        }
    }
    ("=", value.trim())
}

fn priority_matches(expression: &str, priority: u8) -> bool {
    if !valid_priority_expression(expression) {
        return false;
    }
    let (operator, number) = priority_parts(expression);
    let Ok(number) = number.parse::<u8>() else {
        return false;
    };
    match operator {
        ">=" => priority >= number,
        "<=" => priority <= number,
        ">" => priority > number,
        "<" => priority < number,
        _ => priority == number,
    }
}
