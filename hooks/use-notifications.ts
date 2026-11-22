import { type Dispatch, type SetStateAction, useEffect } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { onAction } from '@tauri-apps/plugin-notification'
import { toast } from 'sonner'

import { notificationClick } from '@/lib/tauri/ntfy'

export function useNotifications(setSelected: Dispatch<SetStateAction<string | null>>) {
  useEffect(() => {
    if (!isTauri()) return

    let disposed = false
    let unlisten: (() => void) | undefined

    void onAction(({ actionId, notification }) => {
      if (disposed || (actionId !== 'tap' && actionId !== 'default')) return

      void notificationClick(notification?.id ?? null)
        .then((topicId) => {
          if (!disposed && topicId) setSelected(topicId)
        })
        .catch((failure) => toast.error(String(failure)))
    })
      .then((listener) => {
        if (disposed) listener.unregister()
        else unlisten = () => listener.unregister()
      })
      .catch((failure) => {
        if (!disposed) console.error('Cannot listen to notification clicks', failure)
      })

    return () => {
      disposed = true
      unlisten?.()
    }
  }, [setSelected])
}
