use crate::automation::matcher::MatchContext;

pub fn replace_tokens(value: &str, context: &MatchContext) -> String {
    value
        .replace("$value", &context.value)
        .replace("$message", &context.message)
        .replace("$matchedLine", &context.matched_line)
}
