pub mod automation;
pub mod schedule;
pub mod settings;

pub fn handler() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        settings::get_url,
        settings::set_url,

        automation::list_rules,
        automation::create_rule,
        automation::update_rule,
        automation::delete_rule,
        automation::toggle_rule,
        automation::test_rule,

        automation::list_logs,

        schedule::get_schedule,
        schedule::update_schedule
    ]
}
