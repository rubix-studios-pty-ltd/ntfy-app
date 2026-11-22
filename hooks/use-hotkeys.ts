import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'

import { defaultHotkeys } from '@/lib/constant/hotkeys'
import { editableTarget, shortcutEvent } from '@/lib/hotkeys'
import { getHotkeys } from '@/lib/tauri/hotkeys'
import { messageAction, reconnect } from '@/lib/tauri/ntfy'
import { type Settings } from '@/types/hotkeys'
import { type DialogState, type Snapshot } from '@/types/ntfy'

type Props = {
  busy: boolean
  confirmDelete: (topicId: string | null) => void
  dialog: DialogState
  hotkeyTopics: Snapshot['topics']
  perform: (action: () => Promise<void>) => Promise<void>
  selected: string | null
  setDialog: Dispatch<SetStateAction<DialogState>>
  setSelected: Dispatch<SetStateAction<string | null>>
}

export function useHotkeys({
  busy,
  confirmDelete,
  dialog,
  hotkeyTopics,
  perform,
  selected,
  setDialog,
  setSelected,
}: Props) {
  const [hotkeys, setHotkeys] = useState<Settings>(defaultHotkeys)

  useEffect(() => {
    if (!isTauri()) return

    let active = true

    void getHotkeys()
      .then((value) => {
        if (active) setHotkeys(value)
      })
      .catch((error) => console.error('Cannot load hotkeys', error))

    let unlisten: (() => void) | undefined

    void listen<Settings>('ntfy:hotkeys-changed', ({ payload }) => {
      if (active) setHotkeys(payload)
    })
      .then((off) => {
        if (active) unlisten = off
        else off()
      })
      .catch((error) => console.error('Cannot listen for hotkey updates', error))

    return () => {
      active = false
      unlisten?.()
    }
  }, [])

  useEffect(() => {
    if (!isTauri()) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        event.isComposing ||
        event.defaultPrevented ||
        dialog !== null ||
        document.querySelector('[role="dialog"]') ||
        busy
      )
        return

      const shortcut = shortcutEvent(event)

      if (!shortcut) return

      if (shortcut === hotkeys.nextTopic) {
        if (editableTarget(event.target) || hotkeyTopics.length === 0) return

        event.preventDefault()

        setSelected((current) => {
          const index = hotkeyTopics.findIndex((entry) => entry.id === current)
          return index >= hotkeyTopics.length - 1 ? null : hotkeyTopics[index + 1].id
        })
      } else if (shortcut === hotkeys.deleteNotifications) {
        event.preventDefault()

        confirmDelete(selected)
      } else if (shortcut === hotkeys.publish) {
        if (hotkeyTopics.length === 0) return

        event.preventDefault()

        setDialog({ kind: 'publish' })
      } else if (shortcut === hotkeys.markAllRead) {
        event.preventDefault()

        void perform(() => messageAction(null, selected))
      } else if (shortcut === hotkeys.reconnect) {
        event.preventDefault()

        void perform(reconnect)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    hotkeys,
    hotkeyTopics,
    selected,
    dialog,
    busy,
    perform,
    confirmDelete,
    setDialog,
    setSelected,
  ])
}
