use rusqlite::Connection;

pub fn run(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS app_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);

        CREATE TABLE IF NOT EXISTS ntfy_servers (
            id TEXT PRIMARY KEY, name TEXT NOT NULL, url TEXT NOT NULL UNIQUE,
            auth_kind TEXT NOT NULL CHECK(auth_kind IN ('none','basic','token')),
            username TEXT NOT NULL DEFAULT '', secret TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1
        );

        CREATE TABLE IF NOT EXISTS ntfy_topics (
            id TEXT PRIMARY KEY, server_id TEXT NOT NULL REFERENCES ntfy_servers(id) ON DELETE CASCADE,
            topic TEXT NOT NULL, muted INTEGER NOT NULL DEFAULT 0,
            subscribed_at INTEGER NOT NULL, cursor_time INTEGER,
            UNIQUE(server_id, topic)
        );

        CREATE TABLE IF NOT EXISTS ntfy_receipts (
            topic_id TEXT NOT NULL REFERENCES ntfy_topics(id) ON DELETE CASCADE,
            message_id TEXT NOT NULL, received_at INTEGER NOT NULL,
            PRIMARY KEY(topic_id, message_id)
        );

        CREATE TABLE IF NOT EXISTS ntfy_messages (
            row_id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id TEXT NOT NULL REFERENCES ntfy_topics(id) ON DELETE CASCADE,
            message_id TEXT NOT NULL, time INTEGER NOT NULL, payload TEXT NOT NULL,
            is_read INTEGER NOT NULL DEFAULT 0,
            UNIQUE(topic_id, message_id)
        );
        
        CREATE INDEX IF NOT EXISTS idx_ntfy_messages_topic ON ntfy_messages(topic_id, row_id DESC);
        CREATE INDEX IF NOT EXISTS idx_ntfy_messages_unread ON ntfy_messages(is_read, topic_id);
        CREATE INDEX IF NOT EXISTS idx_ntfy_receipts_received ON ntfy_receipts(received_at);

        CREATE TABLE IF NOT EXISTS automation_rules (
            id TEXT PRIMARY KEY,
            active INTEGER NOT NULL DEFAULT 1,
            name TEXT NOT NULL,
            topic TEXT NOT NULL,
            match_type TEXT NOT NULL,
            match_value TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_value TEXT,
            module_id TEXT,
            action_config TEXT,
            arguments TEXT,
            working_directory TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            last_run_at TEXT,
            status TEXT
        );

        CREATE TABLE IF NOT EXISTS automation_logs (
            id TEXT PRIMARY KEY,
            rule_id TEXT NOT NULL,
            rule_name TEXT NOT NULL,
            topic TEXT,
            title TEXT,
            message TEXT,
            action_type TEXT NOT NULL,
            action_value TEXT,
            module_id TEXT,
            status TEXT NOT NULL,
            error TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS schedule (
            id TEXT PRIMARY KEY CHECK (id = 'default'),
            active INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS schedule_days (
            day_key TEXT PRIMARY KEY CHECK (
                day_key IN (
                    'monday',
                    'tuesday',
                    'wednesday',
                    'thursday',
                    'friday',
                    'saturday',
                    'sunday'
                )
            ),
            active INTEGER NOT NULL DEFAULT 0,
            start_time TEXT NOT NULL DEFAULT '09:00',
            end_time TEXT NOT NULL DEFAULT '17:00',
            updated_at TEXT NOT NULL
        );

        INSERT OR IGNORE INTO schedule (
            id,
            active,
            created_at,
            updated_at
        )
        VALUES (
            'default',
            0,
            datetime('now'),
            datetime('now')
        );

        INSERT OR IGNORE INTO schedule_days (
            day_key,
            active,
            start_time,
            end_time,
            updated_at
        )
        VALUES
            ('monday', 1, '09:00', '17:00', datetime('now')),
            ('tuesday', 1, '09:00', '17:00', datetime('now')),
            ('wednesday', 1, '09:00', '17:00', datetime('now')),
            ('thursday', 1, '09:00', '17:00', datetime('now')),
            ('friday', 1, '09:00', '17:00', datetime('now')),
            ('saturday', 0, '09:00', '17:00', datetime('now')),
            ('sunday', 0, '09:00', '17:00', datetime('now'));

        CREATE INDEX IF NOT EXISTS idx_automation_active
            ON automation_rules(topic, active);

        CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id
            ON automation_logs(rule_id, created_at DESC);
        "#,
    )
}
