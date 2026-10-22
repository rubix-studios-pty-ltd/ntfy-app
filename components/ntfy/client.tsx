'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  BellOff,
  CheckCheck,
  Inbox,
  Plus,
  RefreshCw,
  Search,
  Send,
  Unplug,
} from 'lucide-react'
import { toast } from 'sonner'

import { Confirm } from '@/components/ntfy/confirm'
import { MessageCard } from '@/components/ntfy/message-card'
import { Preferences } from '@/components/ntfy/preferences'
import { PublishForm } from '@/components/ntfy/publish-form'
import { ServerForm } from '@/components/ntfy/server-form'
import { Sidebar } from '@/components/ntfy/sidebar'
import { TopicForm } from '@/components/ntfy/topic-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useNtfy } from '@/hooks/use-ntfy'
import { messageAction, reconnect, removeServer, updateTopic } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type DialogState, type Snapshot } from '@/types/ntfy'

const empty: Snapshot = { servers: [], topics: [], statuses: [], encrypted: false }

export function Client() {
  const [selected, setSelected] = useState<string | null>(null)
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [dialog, setDialog] = useState<DialogState>(null)
  const [busy, setBusy] = useState(false)

  const data = useNtfy(selected, unreadOnly, query)
  const loading = data.pending || search !== query

  const snapshot = data.snapshot ?? empty
  const topic = snapshot.topics.find((item) => item.id === selected)
  const status = snapshot.statuses.find((item) => item.topicId === selected)
  const unread = snapshot.topics.reduce((total, item) => total + item.unread, 0)

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search), 250)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (data.snapshot && selected && !data.snapshot.topics.some((item) => item.id === selected))
      setSelected(null)
  }, [data.snapshot, selected])

  const close = () => setDialog(null)

  const perform = async (action: () => Promise<void>) => {
    if (busy) return
    setBusy(true)

    try {
      await action()
      data.refresh()
    } catch (failure) {
      toast.error(String(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="flex min-h-dvh text-sm">
      <Sidebar
        addServer={() => setDialog({ kind: 'server' })}
        editServer={(id) =>
          setDialog({ kind: 'server', server: snapshot.servers.find((item) => item.id === id) })
        }
        preferences={() => setDialog({ kind: 'preferences' })}
        select={setSelected}
        selected={selected}
        snapshot={snapshot}
      />

      <section className="flex min-w-0 flex-1 flex-col p-6">
        <header className="flex items-center justify-end pb-2">
          <div className="flex items-center gap-2.25">
            {topic ? (
              <>
                <Button
                  className="cursor-pointer duration-500 transition-all border-border bg-card enabled:hover:bg-accent"
                  disabled={busy}
                  onClick={() => void perform(() => updateTopic(topic.id, !topic.muted))}
                  size="icon-sm"
                  variant="outline"
                >
                  {topic.muted ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                </Button>

                <Button
                  className="cursor-pointer duration-500 transition-all border-border bg-card enabled:hover:bg-accent"
                  onClick={() =>
                    setDialog({
                      kind: 'confirm',
                      title: 'Unsubscribe',
                      description:
                        'Local history and saved receipt state for this subscription will be removed.',
                      action: async () => {
                        await updateTopic(topic.id, topic.muted, true)
                        setSelected(null)
                        data.refresh()
                      },
                    })
                  }
                  size="icon-sm"
                  variant="outline"
                >
                  <Unplug className="size-3.5" />
                </Button>
              </>
            ) : (
              <Button
                aria-label="Subscribe to a topic"
                className="cursor-pointer duration-500 transition-all border-border bg-card enabled:hover:bg-accent"
                disabled={!snapshot.servers.some((item) => item.enabled)}
                onClick={() => setDialog({ kind: 'topic' })}
                size="icon-sm"
                variant="outline"
              >
                <Plus className="size-3.5" />
              </Button>
            )}

            <Button
              aria-label="Publish a notification"
              className="cursor-pointer duration-500 transition-all rounded-md border border-primary enabled:hover:bg-primary-hover"
              disabled={snapshot.topics.length === 0}
              onClick={() => setDialog({ kind: 'publish' })}
              size="icon-sm"
              variant="default"
            >
              <Send className="size-3.5" />
            </Button>
          </div>
        </header>

        {data.error && (
          <div
            className="my-2.5 flex items-center justify-between gap-3.5 rounded-[7px] border p-3 text-[11px] leading-[1.6] [&_button]:shrink-0 [&_button]:underline border-danger-border bg-danger-soft text-danger-foreground"
            role="alert"
          >
            <span>{data.error}</span>
            <Button
              className="cursor-pointer duration-500 transition-all h-auto p-0 text-[11px] font-normal text-current underline"
              onClick={data.refresh}
              variant="link"
            >
              Retry
            </Button>
          </div>
        )}

        {data.loading ? (
          <div className="flex grow flex-col items-center justify-center text-muted-foreground">
            <RefreshCw className="animate-spin" size={28} />
          </div>
        ) : snapshot.servers.length === 0 ? (
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
            {status?.detail && (
              <div
                className="flex items-center justify-between gap-3.5 rounded-[7px] border py-2 px-3 text-[11px] leading-xs [&_button]:shrink-0 border-warning-border bg-warning-soft text-warning-foreground"
                role="status"
              >
                {status.detail}
                <Button
                  className="cursor-pointer duration-500 transition-all h-6 p-0 text-[11px] font-normal hover:bg-transparent dark:hover:bg-warning-soft dark:hover:text-warning-foreground"
                  disabled={busy}
                  onClick={() => void perform(reconnect)}
                  size="sm"
                  variant="ghost"
                >
                  Reconnect
                </Button>
              </div>
            )}

            {!selected && snapshot.statuses.some((item) => item.state === 'reconnecting') && (
              <div
                className="flex items-center justify-between gap-3.5 rounded-[7px] border py-2 px-3 text-[11px] leading-xs [&_button]:shrink-0 border-warning-border bg-warning-soft text-warning-foreground"
                role="status"
              >
                Some subscriptions are reconnecting. Select a topic to view its connection details.
                <Button
                  className="cursor-pointer duration-500 transition-all h-6 p-0 text-[11px] font-normal hover:bg-transparent dark:hover:bg-warning-soft dark:hover:text-warning-foreground"
                  disabled={busy}
                  onClick={() => void perform(reconnect)}
                  size="sm"
                  variant="ghost"
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="flex items-center justify-between border-b border-border">
              <div className="flex gap-2">
                <Button
                  className={cn(
                    'cursor-pointer transition-all duration-500 h-auto min-w-16 rounded-none border-b-2 p-3 text-[11px] font-normal hover:bg-transparent dark:hover:bg-transparent',
                    !unreadOnly
                      ? 'border-primary font-[650] text-accent-foreground'
                      : 'border-transparent text-muted-foreground'
                  )}
                  onClick={() => setUnreadOnly(false)}
                  variant="ghost"
                >
                  All
                </Button>

                <Button
                  className={cn(
                    'cursor-pointer transition-all duration-500 h-auto min-w-16 rounded-none border-b-2 p-3 text-[11px] font-normal hover:bg-transparent dark:hover:bg-transparent',
                    unreadOnly
                      ? 'border-primary font-bold text-accent-foreground'
                      : 'border-transparent text-muted-foreground'
                  )}
                  onClick={() => setUnreadOnly(true)}
                  variant="ghost"
                >
                  Unread{' '}
                  {unread > 0 && (
                    <span className="ml-1 rounded bg-muted px-1.25 py-0.5 text-[9px]">
                      {unread}
                    </span>
                  )}
                </Button>
              </div>

              <div className="flex gap-1.25 items-center">
                <Button
                  aria-label="Mark all as read"
                  className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
                  disabled={busy}
                  onClick={() => void perform(() => messageAction(null, selected))}
                  size="icon-xs"
                  variant="ghost"
                >
                  <CheckCheck className="size-4" />
                </Button>

                <Button
                  aria-label="Reconnect subscriptions"
                  className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
                  disabled={busy}
                  onClick={() => void perform(reconnect)}
                  size="icon-xs"
                  variant="ghost"
                >
                  <RefreshCw className="size-3.5" />
                </Button>
              </div>
            </div>

            <div className="relative my-4.75">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />

              <Input
                aria-label="Search notifications"
                className="w-full bg-transparent pl-9 text-[11px] md:text-[11px] text-foreground"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search…"
                type="search"
                value={search}
              />
            </div>

            <div aria-busy={data.loadingMore} className="flex flex-col gap-3">
              {data.messages.map((item) => {
                const source = snapshot.topics.find((itemTopic) => itemTopic.id === item.topicId)
                const name =
                  snapshot.servers.find((itemServer) => itemServer.id === source?.serverId)?.name ??
                  'ntfy'

                return (
                  <MessageCard
                    item={item}
                    key={item.rowId}
                    refresh={data.refresh}
                    remove={() =>
                      setDialog({
                        kind: 'confirm',
                        title: 'Delete',
                        description:
                          'This removes the local message. It will not be shown again when the app reconnects.',
                        action: async () => {
                          await messageAction(item.rowId, null, true)
                          data.refresh()
                        },
                      })
                    }
                    serverName={name}
                  />
                )
              })}

              {!loading && data.ready && data.messages.length === 0 && (
                <div className="flex min-h-77.5 flex-col items-center justify-center gap-3 text-muted-foreground">
                  <Inbox size={35} strokeWidth={1.3} />
                  <h2 className="text-base font-semibold text-foreground">
                    {snapshot.topics.length === 0
                      ? 'Choose your first topic'
                      : search || unreadOnly
                        ? 'No notifications'
                        : "You're all caught up"}
                  </h2>

                  {snapshot.topics.length === 0 && (
                    <Button
                      className="cursor-pointer duration-500 transition-all gap-1.75 rounded border-border bg-card text-[11px] font-semibold text-accent-foreground enabled:hover:bg-accent"
                      onClick={() => setDialog({ kind: 'topic' })}
                      size="sm"
                      variant="outline"
                    >
                      <Plus size={16} />
                      Subscribe
                    </Button>
                  )}
                </div>
              )}
            </div>

            {data.hasMore && (
              <div className="mt-5 flex justify-center">
                <Button
                  className="h-auto gap-1.75 rounded-[7px] border-border bg-background px-3.75 py-2.5 text-[11px] font-semibold text-accent-foreground enabled:hover:bg-accent"
                  disabled={data.loadingMore}
                  onClick={data.loadMore}
                  variant="outline"
                >
                  {data.loadingMore ? 'Loading…' : 'Load older messages'}
                </Button>
              </div>
            )}
          </>
        )}
      </section>

      {dialog?.kind === 'server' && (
        <ServerForm
          close={close}
          remove={
            dialog.server
              ? () =>
                  setDialog({
                    kind: 'confirm',
                    title: 'Remove',
                    description:
                      'Saved credentials, topics and notification history for this server will be removed from this device.',
                    action: async () => {
                      const id = dialog.server?.id
                      if (!id) return
                      await removeServer(id)
                      data.refresh()
                    },
                  })
              : undefined
          }
          saved={data.refresh}
          server={dialog.server}
        />
      )}

      {dialog?.kind === 'topic' && (
        <TopicForm close={close} saved={data.refresh} servers={snapshot.servers} />
      )}

      {dialog?.kind === 'publish' && (
        <PublishForm
          close={close}
          selected={selected}
          servers={snapshot.servers}
          topics={snapshot.topics}
        />
      )}

      {dialog?.kind === 'preferences' && <Preferences close={close} />}

      {dialog?.kind === 'confirm' && <Confirm {...dialog} close={close} />}
    </main>
  )
}
