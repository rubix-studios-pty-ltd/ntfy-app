import { invoke } from '@tauri-apps/api/core'

import { type Settings } from '@/types/hotkeys'

export function getHotkeys() {
  return invoke<Settings>('get_hotkeys')
}

export function updateHotkeys(input: Settings) {
  return invoke<Settings>('update_hotkeys', { input })
}
