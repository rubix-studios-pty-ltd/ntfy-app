'use client'

import { nameToEmoji } from 'gemoji'
import { Check, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Attachment } from '@/components/ntfy/card/attachment'
import { Content } from '@/components/ntfy/card/content'
import { Links } from '@/components/ntfy/card/links'
import { TopicIcon } from '@/components/ntfy/topic-icon'
import { Button } from '@/components/ui/button'
import { messageAction, openExternal } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type StoredMessage, type Topic } from '@/types/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = {
  expanded: boolean
  item: StoredMessage
  onToggleExpand: () => void
  showTags: boolean
  refresh: () => void
  remove: () => void
  serverName: string
  topic?: Topic
}

export function Card({
  item,
  topic,
  serverName,
  refresh,
  remove,
  expanded,
  onToggleExpand,
  showTags,
}: Props) {
  const message = item.message
  const date = new Date(message.time * 1000)

  const expired =
    message.attachment?.expires != null && message.attachment.expires * 1000 < Date.now()

  const open = async (url: string) => {
    try {
      await openExternal(url)
    } catch (failure) {
      toast.error(String(failure))
    }
  }

  return (
    <article className="border-border bg-card relative flex gap-3.25 rounded-[9px] border px-4.25 py-5 shadow-xs max-[700px]:gap-2.25 max-[700px]:px-3 max-[700px]:py-4">
      <div
        className={cn(
          'relative grid size-8.5 shrink-0 place-items-center rounded-[9px] text-[13px] font-semibold',
          message.priority === 5
            ? 'bg-danger-soft text-danger-foreground'
            : message.priority === 4
              ? 'bg-warning-soft text-warning-foreground'
              : 'bg-success-soft text-success'
        )}
      >
        <TopicIcon aria-hidden="true" className="size-4" name={topic?.icon ?? 'bell'} />

        {!item.isRead && (
          <span className="absolute right-0 bottom-0 size-1.25 rounded-full bg-success">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2.5 pr-13 text-[9px] leading-normal text-muted-foreground max-[700px]:flex-col max-[700px]:gap-0.5">
          <span>
            {serverName} <span className="px-1 text-muted-foreground">/ </span>
            <b className="font-[550] text-success-foreground">
              {topic?.displayName || message.topic}
            </b>
          </span>

          <time
            className="whitespace-nowrap"
            dateTime={date.toISOString()}
            title={date.toLocaleString()}
          >
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} -{' '}
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          {showTags &&
            message.tags.map((tag, index) => {
              const normalized = tag.trim().toLowerCase().replace(/^:|:$/g, '')
              const emoji = Object.hasOwn(nameToEmoji, normalized)
                ? nameToEmoji[normalized]
                : undefined

              return emoji ? (
                <span
                  aria-label={tag}
                  className="ml-1 inline-block text-[11px]"
                  key={`${tag}-${index}`}
                  role="img"
                  title={tag}
                >
                  {emoji}
                </span>
              ) : null
            })}

          {safeLink(message.click) ? (
            <button
              className="cursor-pointer truncate text-left text-xs font-semibold text-foreground hover:text-primary hover:underline"
              onClick={() => void open(message.click as string)}
              type="button"
            >
              {message.title || topic?.displayName || message.topic}
            </button>
          ) : (
            <h2 className="truncate text-xs font-semibold text-foreground">
              {message.title || topic?.displayName || message.topic}
            </h2>
          )}

          {(message.priority ?? 3) >= 4 && (
            <span className="rounded-sm bg-warning-soft px-1.25 py-0.5 text-[8px] text-warning-foreground">
              {message.priority === 5 ? 'Urgent' : 'High'}
            </span>
          )}
        </div>

        <Content expanded={expanded} message={message} onToggleExpand={onToggleExpand} />

        {!showTags && message.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.25 items-center">
            <span className="text-[8px] font-bold text-muted-foreground">Tags:</span>
            {message.tags.map((tag) => (
              <span
                className="rounded border border-border bg-success-soft px-1.5 py-0.75 text-[8px] text-muted-foreground"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {message.attachment && safeLink(message.attachment.url) && !expired && (
          <Attachment attachment={message.attachment} />
        )}

        <Links expired={expired} message={message} onOpen={open} />
      </div>

      <div className="absolute top-3.5 right-2.5 flex">
        {!item.isRead && (
          <Button
            aria-label="Mark as read"
            className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
            onClick={async () => {
              try {
                await messageAction(item.rowId, null)
                refresh()
              } catch (failure) {
                toast.error(String(failure))
              }
            }}
            size="icon-xs"
            variant="ghost"
          >
            <Check className="size-4" />
          </Button>
        )}

        <Button
          aria-label="Delete notification"
          className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
          onClick={remove}
          size="icon-xs"
          variant="ghost"
        >
          <Trash2 className="size-3.75" />
        </Button>
      </div>
    </article>
  )
}
