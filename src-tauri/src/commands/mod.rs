pub mod automation;
pub mod hotkeys;
pub mod logs;
pub mod ntfy;
pub mod schedule;

pub fn handler() -> impl Fn(tauri::ipc::Invoke<tauri::Wry>) -> bool + Send + Sync + 'static {
    tauri::generate_handler![
        hotkeys::get_hotkeys,
        hotkeys::update_hotkeys,
        automation::get_rules,
        automation::create_rule,
        automation::update_rule,
        automation::delete_rule,
        automation::toggle_rule,
        automation::test_rule,
        logs::get_logs,
        ntfy::ntfy_snapshot,
        ntfy::ntfy_reorder_servers,
        ntfy::ntfy_reorder_topics,
        ntfy::ntfy_save_server,
        ntfy::ntfy_remove_server,
        ntfy::ntfy_subscribe,
        ntfy::ntfy_topic_display,
        ntfy::ntfy_update_display,
        ntfy::ntfy_update_topic,
        ntfy::ntfy_messages,
        ntfy::ntfy_notification_click,
        ntfy::ntfy_message_action,
        ntfy::ntfy_publish,
        ntfy::ntfy_reconnect,
        ntfy::ntfy_preferences,
        ntfy::ntfy_open_url,
        ntfy::get_url,
        schedule::get_schedule,
        schedule::update_schedule,
    ]
}
