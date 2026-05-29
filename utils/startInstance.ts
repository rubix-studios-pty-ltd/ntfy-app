import { saveUrl } from '@/lib/tauri/saveUrl'
import { normalizeUrl } from '@/utils/normalizeUrl'

export const startInstance = async (instanceUrl: string | null) => {
  const normalized = normalizeUrl(instanceUrl)
  if (!normalized) return
  await saveUrl(normalized)
  window.location.assign(normalized)
}
