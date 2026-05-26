import { invoke } from '@tauri-apps/api/core'

import { normalizeUrl } from '@/utils/normalizeUrl'

export const saveUrl = async (instanceUrl: string) => {
  try {
    const normalized = normalizeUrl(instanceUrl)
    if (!normalized) return
    await invoke('set_url', { url: normalized })
  } catch (error) {
    console.error('Failed to save instance URL:', error)
  }
}
