import { invoke } from '@tauri-apps/api/core'

import {
  type MessageQuery,
  type PublishInput,
  type ServerInput,
  type Snapshot,
  type StoredMessage,
} from '@/types/ntfy'

export function getSnapshot() {
  return invoke<Snapshot>('ntfy_snapshot')
}

export function saveServer(input: ServerInput) {
  return invoke<void>('ntfy_save_server', { input })
}

export function removeServer(id: string) {
  return invoke<void>('ntfy_remove_server', { id })
}

export function subscribe(serverId: string, topic: string) {
  return invoke<void>('ntfy_subscribe', { serverId, topic })
}

export function updateTopic(id: string, muted: boolean, remove = false) {
  return invoke<void>('ntfy_update_topic', { id, muted, remove })
}

export function getMessages(query: MessageQuery) {
  return invoke<StoredMessage[]>('ntfy_messages', { query })
}

export function messageAction(rowId: number | null, topicId: string | null, deleteMessage = false) {
  return invoke<void>('ntfy_message_action', {
    rowId,
    topicId,
    delete: deleteMessage,
  })
}

export function publish(input: PublishInput) {
  return invoke<void>('ntfy_publish', { input })
}

export function reconnect() {
  return invoke<void>('ntfy_reconnect')
}

export function preferences(preview: boolean | null = null) {
  return invoke<boolean>('ntfy_preferences', { preview })
}

export function openExternal(url: string) {
  return invoke<void>('ntfy_open_url', { url })
}
