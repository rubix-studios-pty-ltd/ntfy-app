import { invoke } from '@tauri-apps/api/core'

import { normalizeUrl } from '@/utils/normalizeUrl'

export async function readUrl() {
  try {
    const stored = await invoke<string | null>('get_url')

    return normalizeUrl(stored ?? '')
  } catch {
    return null
  }
}
