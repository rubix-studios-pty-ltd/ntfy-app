use rusqlite::Connection;

pub fn run(connection: &Connection) -> rusqlite::Result<()> {
    connection.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS automation_rules (
            id TEXT PRIMARY KEY,
            active INTEGER NOT NULL DEFAULT 1,
            name TEXT NOT NULL,
            topic TEXT NOT NULL,
            match_type TEXT NOT NULL,
            match_value TEXT NOT NULL,
            action_type TEXT NOT NULL,
            action_value TEXT NOT NULL,
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
            topic TEXT,
            title TEXT,
            message TEXT,
            action_type TEXT NOT NULL,
            action_value TEXT NOT NULL,
            status TEXT NOT NULL,
            error TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (rule_id) REFERENCES automation_rules(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_automation_logs_rule_id
            ON automation_logs(rule_id, created_at DESC);
        "#,
    )
}
