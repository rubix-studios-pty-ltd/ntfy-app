'use client'

import Image from 'next/image'
import { Check, ExternalLink, File, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Markdown } from '@/components/ntfy/markdown'
import { TopicIcon } from '@/components/ntfy/topic-icon'
import { Button } from '@/components/ui/button'
import { messageAction, openExternal } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'
import { type StoredMessage, type Topic } from '@/types/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = {
  item: StoredMessage
  topic?: Topic
  serverName: string
  refresh: () => void
  remove: () => void
}

export function Card({ item, topic, serverName, refresh, remove }: Props) {
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

  const attachmentType = message.attachment?.type?.toLowerCase() ?? ''
  const attachmentName = message.attachment?.name.toLowerCase() ?? ''

  const isImage =
    attachmentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/.test(attachmentName)
  const isVideo = attachmentType.startsWith('video/') || /\.(mp4|webm|mov)$/.test(attachmentName)
  const isAudio =
    attachmentType.startsWith('audio/') || /\.(mp3|m4a|ogg|wav|flac)$/.test(attachmentName)

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
        <TopicIcon aria-hidden="true" className="size-4" name={topic?.icon ?? 'bell'} />

        {!item.isRead && (
          <span className="absolute right-0 bottom-0 size-1.25 animate-pulse rounded-full bg-success motion-reduce:animate-none">
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
        </div>

        {message.markdown ? (
          <Markdown content={message.message} />
        ) : (
          <p className="mt-1.5 text-[11px] leading-[1.8] whitespace-pre-wrap wrap-anywhere text-muted-foreground">
            {message.message}
          </p>
        )}

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

        {message.attachment && safeLink(message.attachment.url) && !expired && (
          <div className="mt-3 max-w-xl overflow-hidden rounded-md border border-border bg-muted/25 p-2.5">
            {isImage && (
              <Image
                alt={message.attachment.name}
                className="max-h-72 w-full rounded object-contain"
                loading="lazy"
                referrerPolicy="no-referrer"
                src={message.attachment.url}
              />
            )}

            {isVideo && (
              // biome-ignore lint/a11y/useMediaCaption: ntfy video attachments do not provide caption tracks
              <video
                className="max-h-72 w-full rounded"
                controls
                preload="none"
                src={message.attachment.url}
              >
                Your browser cannot play this attachment.
              </video>
            )}

            {isAudio && (
              // biome-ignore lint/a11y/useMediaCaption: ntfy audio attachments do not provide caption tracks
              <audio className="w-full" controls preload="none" src={message.attachment.url}>
                Your browser cannot play this attachment.
              </audio>
            )}

            <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
              <span className="truncate">{message.attachment.name}</span>
              {message.attachment.size != null && (
                <span className="shrink-0">
                  {Math.max(0, message.attachment.size / 1024).toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  })}{' '}
                  KB
                </span>
              )}
            </div>
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
                Link
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
