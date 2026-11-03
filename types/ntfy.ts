export type AuthKind = 'none' | 'basic' | 'token'

export type Server = {
  id: string
  name: string
  url: string
  authKind: AuthKind
  username: string
  enabled: boolean
}

export type ServerInput = {
  id: string | null
  name: string
  url: string
  authKind: AuthKind
  username: string
  secret: string | null
}

export type Topic = {
  id: string
  serverId: string
  topic: string
  muted: boolean
  unread: number
  subscribedAt: number
  cursorTime: number | null
}

export type Attachment = {
  name: string
  url: string
  size: number | null
  expires: number | null
  type: string | null
}

export type NtfyAction = {
  action?: string
  label?: string
  url?: string
  value?: string
}

export type NtfyMessage = {
  id: string
  time: number
  event: string
  topic: string
  title: string | null
  message: string
  priority: number | null
  tags: string[]
  click: string | null
  attachment: Attachment | null
  actions: NtfyAction[]
  expires: number | null
  sequence_id: string | null
}

export type StoredMessage = {
  rowId: number
  topicId: string
  isRead: boolean
  message: NtfyMessage
}

export type ConnectionStatus = {
  topicId: string
  state: 'connecting' | 'connected' | 'reconnecting' | 'stopped'
  detail: string | null
}

export type Snapshot = {
  servers: Server[]
  topics: Topic[]
  statuses: ConnectionStatus[]
  encrypted: boolean
}

export type MessageQuery = {
  topicId: string | null
  before: number | null
  unreadOnly: boolean
  search: string
}

export type PublishInput = {
  topicId: string
  title: string
  message: string
  priority: number
  tags: string[]
}

export type DialogState =
  | { kind: 'server'; server?: Server }
  | { kind: 'topic' }
  | { kind: 'publish' }
  | { kind: 'preferences' }
  | { kind: 'confirm'; title: string; description: string; action: () => Promise<void> }
  | null
