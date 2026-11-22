import { invoke } from '@tauri-apps/api/core'

import { type HotkeySettings } from '@/types/hotkeys'

export function getHotkeys() {
  return invoke<HotkeySettings>('get_hotkeys')
}

export function updateHotkeys(input: HotkeySettings) {
  return invoke<HotkeySettings>('update_hotkeys', { input })
}
