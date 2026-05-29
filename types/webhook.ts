export type SuccessResult = {
  success: true
  url: string
}

export type ErrorResult = {
  success: false
  error: string
}

export type WebhookInput = {
  instance: string | null
  topic: string
  token?: string
}

export type WebhookResult = SuccessResult | ErrorResult
