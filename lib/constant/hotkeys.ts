import { type Action, type Settings } from '@/types/hotkeys'

export const defaultHotkeys: Settings = {
  nextTopic: 'Tab',
  deleteNotifications: 'Ctrl+Shift+D',
  publish: 'Ctrl+Shift+P',
  markAllRead: 'Ctrl+Shift+R',
  reconnect: 'Ctrl+Shift+E',
}

export const hotkeyActions: { key: Action; name: string; description: string }[] = [
  {
    key: 'nextTopic',
    name: 'Next topic',
    description: 'Cycle through subscribed topics',
  },
  {
    key: 'markAllRead',
    name: 'Mark read',
    description: 'Mark notifications as read for the selected topic',
  },
  {
    key: 'publish',
    name: 'Publish',
    description: 'Publish a message to the selected topic',
  },
  {
    key: 'deleteNotifications',
    name: 'Delete',
    description: 'Delete notifications for the selected topic',
  },
  {
    key: 'reconnect',
    name: 'Refresh',
    description: 'Refresh notifications for the selected topic',
  },
]
