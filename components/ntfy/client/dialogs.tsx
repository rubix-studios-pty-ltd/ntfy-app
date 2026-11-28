import { type Dispatch, type SetStateAction } from 'react'

import { Confirm } from '@/components/ntfy/confirm'
import { PreferenceForm } from '@/components/ntfy/forms/preference-form'
import { PublishForm } from '@/components/ntfy/forms/publish-form'
import { ServerForm } from '@/components/ntfy/forms/server-form'
import { TopicForm } from '@/components/ntfy/forms/topic-form'
import { type useNtfy } from '@/hooks/use-ntfy'
import { type DialogState, type Snapshot, type Topic } from '@/types/ntfy'

type Props = {
  dialog: DialogState
  editing: Topic | null
  onRemoveServer: (serverId: string) => void
  refresh: ReturnType<typeof useNtfy>['refresh']
  selected: string | null
  setDialog: Dispatch<SetStateAction<DialogState>>
  setShowTags: Dispatch<SetStateAction<boolean>>
  snapshot: Snapshot
}

export function Dialogs({
  dialog,
  editing,
  onRemoveServer,
  refresh,
  selected,
  setDialog,
  setShowTags,
  snapshot,
}: Props) {
  const close = () => setDialog(null)

  const server = dialog?.kind === 'server' ? dialog.server : undefined

  return (
    <>
      {dialog?.kind === 'server' && (
        <ServerForm
          close={close}
          remove={server ? () => onRemoveServer(server.id) : undefined}
          saved={refresh}
          server={server}
        />
      )}

      {dialog?.kind === 'topic' && (
        <TopicForm close={close} editing={editing} saved={refresh} servers={snapshot.servers} />
      )}

      {dialog?.kind === 'publish' && (
        <PublishForm
          close={close}
          selected={selected}
          servers={snapshot.servers}
          topics={snapshot.topics}
        />
      )}

      {dialog?.kind === 'preferences' && (
        <PreferenceForm close={close} saved={(value) => setShowTags(value.showTags)} />
      )}

      {dialog?.kind === 'confirm' && <Confirm {...dialog} close={close} />}
    </>
  )
}
