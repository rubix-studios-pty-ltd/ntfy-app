'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import { DragDropProvider } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { CheckCheck, GripVertical, Inbox, SlidersHorizontal, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import ntfy from '@/assets/ntfy.png'
import { Actions } from '@/components/ntfy/sidebar/actions'
import { TopicGroup } from '@/components/ntfy/sidebar/topic'
import { SortableItem } from '@/components/ntfy/sortable'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { reorderServers, reorderTopics } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type SidebarProps } from '@/types/sidebar'
import { moveItem } from '@/utils/moveItem'
import { sortOrder } from '@/utils/sortOrder'

export function Sidebar({
  snapshot,
  selected,
  select,
  addServer,
  editServer,
  addTopic,
  preferences,
  busy,
  sorted,
  markRead,
  deleteNotifications,
  toggleMute,
  editTopic,
}: SidebarProps) {
  const [serverOrder, setServerOrder] = useState<string[] | null>(null)
  const [topicOrders, setTopicOrders] = useState<Record<string, string[]>>({})
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  const servers = sortOrder(snapshot.servers, serverOrder)
  const disabled = busy || saving
  const unread = snapshot.topics.reduce((total, topic) => total + topic.unread, 0)

  const saveServers = async (ids: string[]) => {
    if (savingRef.current) return
    savingRef.current = true
    setSaving(true)
    const previous = serverOrder
    setServerOrder(ids)

    try {
      await reorderServers(ids)
      sorted()
    } catch (error) {
      setServerOrder(previous)
      toast.error(String(error))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const saveTopics = async (serverId: string, ids: string[]) => {
    if (savingRef.current) return
    savingRef.current = true

    setSaving(true)

    const previous = topicOrders[serverId]
    setTopicOrders((current) => ({ ...current, [serverId]: ids }))

    try {
      await reorderTopics(serverId, ids)
      sorted()
    } catch (error) {
      setTopicOrders((current) => {
        const next = { ...current }
        if (previous) next[serverId] = previous
        else delete next[serverId]
        return next
      })
      toast.error(String(error))
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  return (
    <aside className="sticky top-0 flex h-dvh w-60 shrink-0 flex-col gap-2.25 border-r border-border bg-card p-4">
      <div className="flex h-12 select-none flex-row items-center gap-2 px-2 text-foreground">
        <Image alt="ntfy" className="size-6" loading="eager" src={ntfy} />
        <h1 className="text-base font-semibold">ntfy</h1>
      </div>

      <ContextMenu>
        <ContextMenuTrigger asChild>
          <Button
            aria-pressed={selected === null}
            className="group w-full cursor-pointer justify-between px-1 font-normal text-muted-foreground transition-all duration-500 hover:bg-transparent dark:hover:bg-transparent"
            onClick={() => select(null)}
            size="sm"
            variant="ghost"
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'relative flex size-5 shrink-0 items-center justify-center rounded-md border border-border p-3 transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground',
                  selected === null && 'bg-accent text-accent-foreground'
                )}
              >
                <Inbox className="size-3.5" />
              </span>

              <span className="text-xs">Notifications</span>
            </div>

            {unread > 0 && (
              <b className="inline-block min-w-5.25 rounded bg-accent px-1.25 py-0.5 text-center text-[10px] text-accent-foreground">
                {unread}
              </b>
            )}
          </Button>
        </ContextMenuTrigger>

        <ContextMenuContent className="min-w-32 space-y-1">
          <ContextMenuItem
            className="cursor-pointer transition-all duration-500"
            disabled={busy}
            onSelect={() => markRead(null)}
          >
            <CheckCheck className="size-3.5" />
            Read
          </ContextMenuItem>

          <ContextMenuItem
            className="cursor-pointer transition-all duration-500"
            disabled={busy}
            onSelect={() => deleteNotifications(null)}
            variant="destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <nav aria-label="Subscriptions" className="min-h-22.5 flex-1 overflow-y-auto">
        <DragDropProvider
          onDragEnd={(event) => {
            if (event.canceled || disabled) return
            const { source } = event.operation

            if (!isSortable(source)) return

            const next = moveItem(
              servers.map((server) => server.id),
              source.initialIndex,
              source.index
            )
            if (next) void saveServers(next)
          }}
        >
          {servers.map((server, index) => {
            const topics = sortOrder(
              snapshot.topics.filter((topic) => topic.serverId === server.id),
              topicOrders[server.id]
            )

            const dragDisabled = disabled || servers.length < 2

            return (
              <SortableItem
                className="mb-3.5"
                disabled={dragDisabled}
                id={server.id}
                index={index}
                key={server.id}
              >
                {(handleRef) => (
                  <section className="flex flex-col gap-1">
                    <div className="group/server flex items-center justify-between text-[11px] font-[650] text-foreground">
                      {servers.length > 1 && (
                        <Button
                          aria-label={`Move ${server.name}`}
                          className="size-5 shrink-0 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity group-hover/server:opacity-100 focus-visible:opacity-100 active:cursor-grabbing max-[700px]:opacity-100"
                          disabled={dragDisabled}
                          onKeyDown={(event) => {
                            if (
                              !event.altKey ||
                              (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')
                            )
                              return

                            event.preventDefault()
                            event.stopPropagation()

                            const next = moveItem(
                              servers.map((item) => item.id),
                              index,
                              index + (event.key === 'ArrowUp' ? -1 : 1)
                            )

                            if (next) void saveServers(next)
                          }}
                          ref={handleRef}
                          size="icon-xs"
                          title="Drag to reorder, or use Alt+Up/Down"
                          type="button"
                          variant="ghost"
                        >
                          <GripVertical className="size-3.5" />
                        </Button>
                      )}

                      <span className="min-w-0 flex-1 truncate px-1" title={server.url}>
                        {server.name}
                      </span>

                      <Button
                        aria-label={`Edit ${server.name}`}
                        className="cursor-pointer text-muted-foreground transition-all duration-500 hover:text-primary"
                        onClick={() => editServer(server.id)}
                        size="icon-xs"
                        variant="ghost"
                      >
                        <SlidersHorizontal className="size-3" />
                      </Button>
                    </div>

                    <TopicGroup
                      busy={busy}
                      deleteNotifications={deleteNotifications}
                      disabled={disabled}
                      editTopic={editTopic}
                      markRead={markRead}
                      onReorder={(id, ids) => void saveTopics(id, ids)}
                      select={select}
                      selected={selected}
                      server={server}
                      statuses={snapshot.statuses}
                      toggleMute={toggleMute}
                      topics={topics}
                    />

                    {!server.enabled && (
                      <p className="px-3 py-2 text-xs leading-[1.7] text-muted-foreground">
                        Sign in to resume listening
                      </p>
                    )}
                    {topics.length === 0 && (
                      <p className="px-3 py-2 text-xs leading-[1.7] text-muted-foreground">
                        No subscriptions
                      </p>
                    )}
                  </section>
                )}
              </SortableItem>
            )
          })}
        </DragDropProvider>

        {servers.length === 0 && (
          <p className="px-3 py-2 text-xs leading-[1.7] text-muted-foreground">
            Connect a server to get started.
          </p>
        )}
      </nav>

      <Actions
        addServer={addServer}
        addTopic={addTopic}
        hasTopics={snapshot.topics.length > 0}
        preferences={preferences}
      />
    </aside>
  )
}
