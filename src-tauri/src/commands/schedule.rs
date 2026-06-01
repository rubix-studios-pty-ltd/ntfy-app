use tauri::State;

use crate::db::models::{Schedule, ScheduleInput};
use crate::db::{DbState, repo, run};

#[tauri::command]
pub async fn get_schedule(state: State<'_, DbState>) -> Result<Schedule, String> {
    run(state, repo::get_schedule).await
}

#[tauri::command]
pub async fn update_schedule(
    state: State<'_, DbState>,
    input: ScheduleInput,
) -> Result<Schedule, String> {
    run(state, move |conn| repo::update_schedule(conn, input)).await
}
