import { invoke } from '@tauri-apps/api/core'

export function readUrl() {
  return invoke<string | null>('get_url')
}
