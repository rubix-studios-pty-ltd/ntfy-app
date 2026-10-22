'use client'

import { Check, ExternalLink, File, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { messageAction, openExternal } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type StoredMessage } from '@/types/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = {
  item: StoredMessage
  serverName: string
  refresh: () => void
  remove: () => void
}

export function MessageCard({ item, serverName, refresh, remove }: Props) {
  const message = item.message

  const open = async (url: string) => {
    try {
      await openExternal(url)
    } catch (failure) {
      toast.error(String(failure))
    }
  }

  const expired =
    message.attachment?.expires != null && message.attachment.expires * 1000 < Date.now()

  const date = new Date(message.time * 1000)

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
        <span>{message.topic.slice(0, 1).toUpperCase()}</span>

        {!item.isRead && (
          <span className="absolute right-0 bottom-0 size-1.25 animate-pulse rounded-full bg-success motion-reduce:animate-none">
            <span className="sr-only">Unread</span>
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex justify-between gap-2.5 pr-13 text-[9px] leading-normal text-muted-foreground max-[700px]:flex-col max-[700px]:gap-0.5">
          <span>
            {serverName} <span className="px-1 text-muted-foreground">/</span>{' '}
            <b className="font-[550] text-success-foreground">{message.topic}</b>
          </span>

          <time
            className="whitespace-nowrap"
            dateTime={date.toISOString()}
            title={date.toLocaleString()}
          >
            {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ·{' '}
            {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>

        <div className="mt-2.5 flex items-center gap-2">
          {(message.priority ?? 3) >= 4 && (
            <span className="rounded-sm bg-warning-soft px-1.25 py-0.5 text-[8px] text-warning-foreground">
              {message.priority === 5 ? 'Urgent' : 'High'}
            </span>
          )}

          <h2 className="text-xs font-semibold truncate text-foreground">
            {message.title || message.topic}
          </h2>
        </div>

        <p className="mt-1.5 text-[11px] leading-[1.8] whitespace-pre-wrap wrap-anywhere text-muted-foreground">
          {message.message}
        </p>

        {message.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.25">
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

        {(message.click || message.attachment || message.actions.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-3.25 text-[10px] text-primary">
            {safeLink(message.click) && (
              <Button
                className="cursor-pointer duration-500 transition-all h-auto gap-1 p-0 has-[>svg]:px-0 text-[10px] font-normal whitespace-normal"
                onClick={() => void open(message.click as string)}
                variant="link"
              >
                <ExternalLink className="size-3.25" />
                Open link
              </Button>
            )}

            {message.attachment && safeLink(message.attachment.url) && (
              <Button
                className="cursor-pointer duration-500 transition-all h-auto gap-1 p-0 has-[>svg]:px-0 text-[10px] font-normal whitespace-normal"
                disabled={expired}
                onClick={() => {
                  const url = message.attachment?.url
                  if (safeLink(url)) void open(url)
                }}
                variant="link"
              >
                <File className="size-3.25" />
                {message.attachment.name}
                {expired ? ' (expired)' : ''}
              </Button>
            )}

            {message.actions.map((action, index) =>
              action && action.action === 'view' && safeLink(action.url) ? (
                <Button
                  className="cursor-pointer duration-500 transition-all h-auto gap-1 p-0 has-[>svg]:px-0 text-[10px] font-normal whitespace-normal"
                  key={`${action.label}-${index}`}
                  onClick={() => void open(action.url as string)}
                  variant="link"
                >
                  <ExternalLink className="size-3.25" />
                  {action.label || 'Open'}
                </Button>
              ) : action && action.action === 'copy' && typeof action.value === 'string' ? (
                <Button
                  className="cursor-pointer duration-500 transition-all h-auto gap-1 p-0 has-[>svg]:px-0 text-[10px] font-normal whitespace-normal"
                  key={`${action.label}-${index}`}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(action.value as string)
                      toast.success('Copied')
                    } catch {
                      toast.error('Cannot access the clipboard')
                    }
                  }}
                  variant="link"
                >
                  {action.label || 'Copy'}
                </Button>
              ) : null
            )}
          </div>
        )}
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
