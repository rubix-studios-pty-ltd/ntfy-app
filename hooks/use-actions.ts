import { type Dispatch, type SetStateAction, useCallback, useState } from 'react'
import { toast } from 'sonner'

import { type useNtfy } from '@/hooks/use-ntfy'
import { messageAction, removeServer, updateTopic } from '@/lib/tauri/ntfy'
import { type DialogState, type Topic } from '@/types/ntfy'

type Props = {
  refresh: ReturnType<typeof useNtfy>['refresh']
  setDialog: Dispatch<SetStateAction<DialogState>>
  setSelected: Dispatch<SetStateAction<string | null>>
}

export function useActions({ refresh, setDialog, setSelected }: Props) {
  const [busy, setBusy] = useState(false)

  const perform = useCallback(
    async (action: () => Promise<void>) => {
      if (busy) return
      setBusy(true)

      try {
        await action()
        refresh()
      } catch (failure) {
        toast.error(String(failure))
      } finally {
        setBusy(false)
      }
    },
    [busy, refresh]
  )

  const confirmDelete = useCallback(
    (topicId: string | null) => {
      if (busy) return

      setDialog({
        kind: 'confirm',
        title: topicId ? 'Delete topic notifications' : 'Delete all notifications',
        description: topicId
          ? 'All locally stored notifications for this topic will be deleted.'
          : 'All locally stored notifications for every topic will be deleted.',
        action: async () => {
          await messageAction(null, topicId, true)
          refresh()
        },
      })
    },
    [busy, refresh, setDialog]
  )

  const disconnect = useCallback(
    (topic: Topic) => {
      if (busy) return

      setDialog({
        kind: 'confirm',
        title: 'Unsubscribe',
        description: 'Local history and saved receipt state for this subscription will be removed.',
        action: async () => {
          await updateTopic(topic.id, topic.muted, true)
          setSelected((current) => (current === topic.id ? null : current))
          refresh()
        },
      })
    },
    [busy, refresh, setDialog, setSelected]
  )

  const removeMessage = useCallback(
    (rowId: number) => {
      setDialog({
        kind: 'confirm',
        title: 'Delete',
        description:
          'This removes the local message. It will not be shown again when the app reconnects.',
        action: async () => {
          await messageAction(rowId, null, true)
          refresh()
        },
      })
    },
    [refresh, setDialog]
  )

  const confirmRemove = useCallback(
    (serverId: string) => {
      setDialog({
        kind: 'confirm',
        title: 'Remove',
        description:
          'Saved credentials, topics and notification history for this server will be removed from this device.',
        action: async () => {
          await removeServer(serverId)
          refresh()
        },
      })
    },
    [refresh, setDialog]
  )

  return {
    busy,
    perform,
    confirmDelete,
    disconnect,
    removeMessage,
    removeServer: confirmRemove,
  }
}
