import { invoke } from '@tauri-apps/api/core'

import { normalizeUrl } from '@/utils/normalizeUrl'

export const readUrl = async () => {
  try {
    const stored = await invoke<string | null>('get_url')

    return normalizeUrl(stored ?? '')
  } catch {
    return null
  }
}

export const saveUrl = async (instanceUrl: string) => {
  try {
    const normalized = normalizeUrl(instanceUrl)
    if (!normalized) return
    await invoke('set_url', { url: normalized })
  } catch (error) {
    console.error('Failed to save instance URL:', error)
  }
}
