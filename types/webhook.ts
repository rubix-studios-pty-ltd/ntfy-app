type SuccessResult = {
  success: true
  url: string
}

type ErrorResult = {
  success: false
  error: string
}

export type WebhookInput = {
  instance: string | null
  topic: string
  token?: string
}

export type WebhookResult = SuccessResult | ErrorResult
