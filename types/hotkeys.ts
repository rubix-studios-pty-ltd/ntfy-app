export type Settings = {
  nextTopic: string
  deleteNotifications: string
  publish: string
  markAllRead: string
  reconnect: string
}

export type Action = keyof Settings
