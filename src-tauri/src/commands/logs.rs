use crate::db::models::{LogsInput, LogsList};
use crate::db::{DbState, repo, run};

#[tauri::command]
pub async fn get_logs(
    state: tauri::State<'_, DbState>,
    input: LogsInput,
) -> Result<LogsList, String> {
    run(state, move |conn| repo::list_logs(conn, input)).await
}
