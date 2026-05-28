import { type WebhookInput, type WebhookResult } from '@/types/webhook'

export const buildUrl = ({ instance, topic, token }: WebhookInput): WebhookResult => {
  const cleanInstance = instance?.trim().replace(/\/+$/, '')
  const cleanTopic = topic.trim()
  const cleanToken = token?.trim()

  if (!cleanInstance) {
    return {
      success: false,
      error: 'Missing instance URL...',
    }
  }

  if (!cleanTopic) {
    return {
      success: false,
      error: 'Please enter a topic...',
    }
  }

  let url = `${cleanInstance}/${encodeURIComponent(cleanTopic)}`

  if (cleanToken) {
    const authParam = btoa(`Bearer ${cleanToken}`).replace(/=+$/, '')
    url += `?auth=${encodeURIComponent(authParam)}`
  }

  return {
    success: true,
    url,
  }
}
