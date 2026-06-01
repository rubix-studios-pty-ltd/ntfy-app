pub mod automation;
pub mod logs;
pub mod schedule;
pub mod settings;

pub fn handler() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        automation::get_rules,
        automation::create_rule,
        automation::update_rule,
        automation::delete_rule,
        automation::toggle_rule,
        automation::test_rule,
        logs::get_logs,
        schedule::get_schedule,
        schedule::update_schedule,
        settings::get_url,
        settings::set_url
    ]
}
