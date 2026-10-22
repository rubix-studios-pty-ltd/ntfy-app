import { invoke } from '@tauri-apps/api/core'

import { type LogsInput, type LogsList } from '@/types/logs'

export function getLogs(input: LogsInput = {}) {
  return invoke<LogsList>('get_logs', { input })
}
