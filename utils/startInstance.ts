import { normalizeUrl } from '@/utils/normalizeUrl'
import { saveUrl } from '@/utils/saveUrl'

export async function startInstance(instanceUrl: string | null) {
  const normalized = normalizeUrl(instanceUrl)
  if (!normalized) return
  await saveUrl(normalized)
  window.location.assign(normalized)
}
