import { invoke } from '@tauri-apps/api/core'

import { type Schedule } from '@/types/schedule'

export function getSchedule() {
  return invoke<Schedule>('get_schedule')
}

export function updateSchedule(schedule: Schedule) {
  return invoke<Schedule>('update_schedule', { input: schedule })
}
