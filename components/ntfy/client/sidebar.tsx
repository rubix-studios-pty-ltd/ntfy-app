import { type Dispatch, type SetStateAction, useState } from 'react'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'

import { Sidebar } from '@/components/ntfy/sidebar'
import { Button } from '@/components/ui/button'
import { type useNtfy } from '@/hooks/use-ntfy'
import { messageAction, updateTopic } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type DialogState, type Snapshot, type Topic } from '@/types/ntfy'

type Props = {
  busy: boolean
  confirmDelete: (topicId: string | null) => void
  onOpenTopic: (topic?: Topic) => void
  perform: (action: () => Promise<void>) => Promise<void>
  refresh: ReturnType<typeof useNtfy>['refresh']
  selected: string | null
  setDialog: Dispatch<SetStateAction<DialogState>>
  setSelected: Dispatch<SetStateAction<string | null>>
  snapshot: Snapshot
}

export function SideMount({
  busy,
  confirmDelete,
  onOpenTopic,
  perform,
  refresh,
  selected,
  setDialog,
  setSelected,
  snapshot,
}: Props) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div
      className={cn(
        'sticky top-0 z-20 h-dvh shrink-0 transition-[width] duration-300',
        collapsed ? 'w-0' : 'w-60'
      )}
    >
      <div
        aria-hidden={collapsed}
        className="h-full overflow-hidden"
        id="ntfy-sidebar"
        inert={collapsed}
      >
        <Sidebar
          addServer={() => setDialog({ kind: 'server' })}
          addTopic={() => onOpenTopic()}
          busy={busy}
          deleteNotifications={(entry) => confirmDelete(entry?.id ?? null)}
          editServer={(id) =>
            setDialog({
              kind: 'server',
              server: snapshot.servers.find((entry) => entry.id === id),
            })
          }
          editTopic={onOpenTopic}
          markRead={(entry) => void perform(() => messageAction(null, entry?.id ?? null))}
          preferences={() => setDialog({ kind: 'preferences' })}
          select={setSelected}
          selected={selected}
          snapshot={snapshot}
          sorted={() => refresh(false)}
          toggleMute={(entry) => void perform(() => updateTopic(entry.id, !entry.muted))}
        />
      </div>

      <Button
        aria-controls="ntfy-sidebar"
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand' : 'Collapse'}
        className="absolute top-6 right-0 z-10 translate-x-1/2 cursor-pointer border border-border bg-card transition-colors duration-300"
        onClick={() => setCollapsed((value) => !value)}
        size="icon-xs"
        variant="secondary"
      >
        {collapsed ? (
          <PanelLeftOpen className="size-3.5" />
        ) : (
          <PanelLeftClose className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
