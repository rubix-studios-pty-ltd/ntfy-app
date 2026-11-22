'use client'

import { DragDropProvider } from '@dnd-kit/react'
import { isSortable } from '@dnd-kit/react/sortable'
import { Bell, BellOff, CheckCheck, GripVertical, Pencil, Trash2 } from 'lucide-react'

import { SortableItem } from '@/components/ntfy/sortable'
import { TopicIcon } from '@/components/ntfy/topic-icon'
import { Button } from '@/components/ui/button'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { cn } from '@/lib/utils'
import { type TopicProps } from '@/types/sidebar'
import { moveItem } from '@/utils/moveItem'

export function TopicGroup({
  server,
  topics,
  statuses,
  disabled,
  selected,
  select,
  busy,
  markRead,
  deleteNotifications,
  toggleMute,
  editTopic,
  onReorder,
}: TopicProps) {
  return (
    <DragDropProvider
      onDragEnd={(event) => {
        if (event.canceled || disabled) return

        const { source } = event.operation

        if (!isSortable(source)) return

        const next = moveItem(
          topics.map((item) => item.id),
          source.initialIndex,
          source.index
        )

        if (next) onReorder(server.id, next)
      }}
    >
      <div className="flex flex-col gap-1">
        {topics.map((topic, index) => {
          const current = statuses.find((status) => status.topicId === topic.id)
          const dragDisabled = disabled || topics.length < 2

          return (
            <SortableItem disabled={dragDisabled} id={topic.id} index={index} key={topic.id}>
              {(handleRef) => (
                <div className="group/topic relative flex min-w-0 items-center">
                  <Button
                    aria-label={`Move ${topic.displayName || topic.topic}`}
                    className="absolute left-0 top-1/2 z-10 size-5 -translate-y-1/2 cursor-grab touch-none text-muted-foreground opacity-0 transition-opacity duration-300 group-hover/topic:opacity-100 group-focus-within/topic:opacity-100 active:cursor-grabbing max-[700px]:opacity-100"
                    disabled={dragDisabled}
                    onKeyDown={(event) => {
                      if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown'))
                        return

                      event.preventDefault()
                      event.stopPropagation()

                      const next = moveItem(
                        topics.map((item) => item.id),
                        index,
                        index + (event.key === 'ArrowUp' ? -1 : 1)
                      )

                      if (next) onReorder(server.id, next)
                    }}
                    ref={handleRef}
                    size="icon-xs"
                    title="Drag to reorder, or use Alt+Up/Down"
                    type="button"
                    variant="ghost"
                  >
                    <GripVertical className="size-3.5" />
                  </Button>

                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button
                        aria-pressed={selected === topic.id}
                        className="group min-w-0 flex-1 cursor-pointer justify-start gap-2.5 px-1 text-left text-xs font-normal text-muted-foreground transition-all duration-300 hover:bg-transparent group-hover/topic:ml-5 group-focus-within/topic:ml-5 dark:hover:bg-transparent max-[700px]:ml-5"
                        onClick={() => select(topic.id)}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <span
                          className={cn(
                            'relative flex size-5 shrink-0 items-center justify-center rounded-md border border-border p-3 transition-all duration-500 group-hover:bg-accent group-hover:text-accent-foreground',
                            selected === topic.id && 'bg-accent text-accent-foreground'
                          )}
                        >
                          <TopicIcon aria-hidden="true" className="size-3.5" name={topic.icon} />

                          <span
                            aria-hidden="true"
                            className={cn(
                              'absolute -bottom-0.5 -right-0.5 size-1 rounded-full ring-2 ring-card',
                              current?.state === 'connected'
                                ? 'animate-pulse bg-success'
                                : 'bg-muted-foreground'
                            )}
                          />
                        </span>

                        <span className="min-w-0 flex-1 truncate">
                          {topic.displayName || topic.topic}
                        </span>

                        {topic.muted && <BellOff className="size-3.25" />}

                        {topic.unread > 0 && (
                          <b className="inline-block min-w-5.25 rounded bg-accent px-1.25 py-0.5 text-center text-[10px] text-accent-foreground">
                            {topic.unread}
                          </b>
                        )}
                      </Button>
                    </ContextMenuTrigger>

                    <ContextMenuContent className="min-w-32 space-y-1">
                      <ContextMenuItem
                        className="cursor-pointer transition-all duration-500"
                        disabled={busy}
                        onSelect={() => markRead(topic)}
                      >
                        <CheckCheck className="size-3.5" />
                        Read
                      </ContextMenuItem>

                      <ContextMenuItem
                        className="cursor-pointer transition-all duration-500"
                        disabled={busy}
                        onSelect={() => toggleMute(topic)}
                      >
                        {topic.muted ? (
                          <Bell className="size-3.5" />
                        ) : (
                          <BellOff className="size-3.5" />
                        )}
                        {topic.muted ? 'Unmute' : 'Mute'}
                      </ContextMenuItem>

                      <ContextMenuItem
                        className="cursor-pointer transition-all duration-500"
                        disabled={busy}
                        onSelect={() => editTopic(topic)}
                      >
                        <Pencil className="size-3.5" />
                        Edit
                      </ContextMenuItem>

                      <ContextMenuItem
                        className="cursor-pointer transition-all duration-500"
                        disabled={busy}
                        onSelect={() => deleteNotifications(topic)}
                        variant="destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Delete
                      </ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>
                </div>
              )}
            </SortableItem>
          )
        })}
      </div>
    </DragDropProvider>
  )
}
