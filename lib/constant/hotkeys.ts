import { type HotkeyAction, type HotkeySettings } from '@/types/hotkeys'

export const defaultHotkeys: HotkeySettings = {
  nextTopic: 'Tab',
  deleteNotifications: 'Ctrl+Shift+D',
  publish: 'Ctrl+Shift+P',
  markAllRead: 'Ctrl+Shift+R',
  reconnect: 'Ctrl+Shift+E',
}

export const hotkeyActions: { key: HotkeyAction; name: string; description: string }[] = [
  {
    key: 'nextTopic',
    name: 'Next topic',
    description: 'Cycle through all topics and subscriptions',
  },
  {
    key: 'markAllRead',
    name: 'Mark as read',
    description: 'Mark all notifications as read for the selected topic',
  },
  {
    key: 'publish',
    name: 'Publish notification',
    description: 'Publish notification for the selected topic',
  },
  {
    key: 'deleteNotifications',
    name: 'Delete notifications',
    description: 'Delete notifications for the selected topic',
  },
  {
    key: 'reconnect',
    name: 'Refresh notifications',
    description: 'Refresh and retrieve notifications for the selected topic',
  },
]
