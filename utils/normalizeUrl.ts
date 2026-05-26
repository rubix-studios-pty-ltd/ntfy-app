export const normalizeUrl = (value: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) {
    return null
  }

  const candidate = trimmed.includes('://') ? trimmed : `https://${trimmed}`

  try {
    const parsed = new URL(candidate)
    parsed.hash = ''
    parsed.search = ''
    parsed.pathname = parsed.pathname.replace(/\/+$/, '')

    return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`
  } catch {
    return null
  }
}
