'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { Dialogs } from '@/components/ntfy/client/dialogs'
import { Header } from '@/components/ntfy/client/header'
import { Messages } from '@/components/ntfy/client/messages'
import { SideMount } from '@/components/ntfy/client/sidebar'
import { Status } from '@/components/ntfy/client/status'
import { Toolbar } from '@/components/ntfy/client/toolbar'
import { Button } from '@/components/ui/button'
import { useActions } from '@/hooks/use-actions'
import { useHotkeys } from '@/hooks/use-hotkeys'
import { useNotifications } from '@/hooks/use-notifications'
import { useNtfy } from '@/hooks/use-ntfy'
import { useTags } from '@/hooks/use-tags'
import { reconnect } from '@/lib/tauri/ntfy'
import { type DialogState, type Snapshot, type Topic } from '@/types/ntfy'

const empty: Snapshot = { servers: [], topics: [], statuses: [], encrypted: false }

export function Client() {
  const [showTags, setShowTags] = useTags()
  const [selected, setSelected] = useState<string | null>(null)
  const [editing, setEditing] = useState<Topic | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  const data = useNtfy(selected, unreadOnly, query)

  const snapshot = data.snapshot ?? empty
  const topic = snapshot.topics.find((entry) => entry.id === selected)
  const status = snapshot.statuses.find((entry) => entry.topicId === selected)
  const unread = snapshot.topics.reduce((total, entry) => total + entry.unread, 0)

  const loading = data.pending || search !== query

  const { busy, perform, confirmDelete, disconnect, removeMessage, removeServer } = useActions({
    refresh: data.refresh,
    setDialog,
    setSelected,
  })

  const openTopic = (entry?: Topic) => {
    setEditing(entry ?? null)
    setDialog({ kind: 'topic' })
  }

  useNotifications(setSelected)

  useHotkeys({
    busy,
    confirmDelete,
    dialog,
    hotkeyTopics: snapshot.topics,
    perform,
    selected,
    setDialog,
    setSelected,
  })

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (data.snapshot && selected && !data.snapshot.topics.some((entry) => entry.id === selected)) {
      setSelected(null)
    }
  }, [data.snapshot, selected])

  return (
    <main className="flex min-h-dvh text-sm">
      <SideMount
        busy={busy}
        confirmDelete={confirmDelete}
        onOpenTopic={openTopic}
        perform={perform}
        refresh={data.refresh}
        selected={selected}
        setDialog={setDialog}
        setSelected={setSelected}
        snapshot={snapshot}
      />

      <section className="relative flex min-w-0 flex-1 flex-col p-6">
        <Header
          busy={busy}
          disconnect={disconnect}
          hasTopics={snapshot.topics.length > 0}
          onOpenTopic={openTopic}
          perform={perform}
          setDialog={setDialog}
          topic={topic}
        />

        {data.error && (
          <div
            className="my-2.5 flex items-center justify-between gap-3.5 rounded-[7px] border p-3 text-[11px] leading-[1.6] [&_button]:shrink-0 [&_button]:underline border-danger-border bg-danger-soft text-danger-foreground"
            role="alert"
          >
            <span>{data.error}</span>
            <Button
              className="cursor-pointer duration-500 transition-all h-auto p-0 text-[11px] font-normal text-current underline"
              onClick={() => data.refresh()}
              variant="link"
            >
              Retry
            </Button>
          </div>
        )}

        {data.loading ? null : snapshot.servers.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-12.5 text-center">
            <Button
              className="cursor-pointer duration-500 transition-all gap-1.75 rounded-md border border-primary text-[11px] font-semibold enabled:hover:bg-primary-hover"
              disabled={!data.snapshot}
              onClick={() => setDialog({ kind: 'server' })}
              size="sm"
              variant="default"
            >
              <Plus size={16} />
              Connect
            </Button>
          </div>
        ) : (
          <>
            <Status
              busy={busy}
              onReconnect={() => void perform(reconnect)}
              selected={selected}
              status={status}
              statuses={snapshot.statuses}
            />

            <Toolbar
              busy={busy}
              confirmDelete={confirmDelete}
              perform={perform}
              search={search}
              selected={selected}
              setSearch={setSearch}
              setUnreadOnly={setUnreadOnly}
              unread={unread}
              unreadOnly={unreadOnly}
            />

            <Messages
              data={data}
              expandedId={expandedId}
              loading={loading}
              onOpenTopic={() => openTopic()}
              onRemove={removeMessage}
              onToggleExpand={(rowId) =>
                setExpandedId((current) => (current === rowId ? null : rowId))
              }
              search={search}
              showTags={showTags}
              snapshot={snapshot}
              unreadOnly={unreadOnly}
            />
          </>
        )}
      </section>

      <Dialogs
        dialog={dialog}
        editing={editing}
        onRemoveServer={removeServer}
        refresh={data.refresh}
        selected={selected}
        setDialog={setDialog}
        setShowTags={setShowTags}
        snapshot={snapshot}
      />
    </main>
  )
}
