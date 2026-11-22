export type HotkeySettings = {
  nextTopic: string
  deleteNotifications: string
  publish: string
  markAllRead: string
  reconnect: string
}

export type HotkeyAction = keyof HotkeySettings
