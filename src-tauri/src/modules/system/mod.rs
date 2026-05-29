use crate::automation::matcher::MatchContext;
use crate::automation::modules::ModuleField;
use crate::db::models::AutomationRule;

pub fn fields(module_id: &str) -> Option<&'static [ModuleField]> {
    match module_id {
        "hibernate" | "logout" | "reboot" | "shutdown" | "sleep" => Some(&[]),
        _ => None,
    }
}

pub fn execute(
    module_id: &str,
    _rule: &AutomationRule,
    _context: &MatchContext,
) -> Result<(), String> {
    match module_id {
        "hibernate" => system_shutdown::hibernate()
            .map_err(|error| format!("Failed to hibernate machine: {error}")),

        "logout" => {
            system_shutdown::logout().map_err(|error| format!("Failed to log out user: {error}"))
        }

        "reboot" => {
            system_shutdown::reboot().map_err(|error| format!("Failed to reboot machine: {error}"))
        }

        "shutdown" => system_shutdown::shutdown()
            .map_err(|error| format!("Failed to shut down machine: {error}")),

        "sleep" => system_shutdown::sleep()
            .map_err(|error| format!("Failed to put machine to sleep: {error}")),

        _ => Err(format!("Unknown system module: {module_id}")),
    }
}
