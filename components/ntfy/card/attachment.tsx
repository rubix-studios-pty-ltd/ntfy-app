'use client'

import { useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { type StoredMessage } from '@/types/ntfy'

type Props = {
  attachment: NonNullable<StoredMessage['message']['attachment']>
}

export function Attachment({ attachment }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const attachmentType = attachment.type?.toLowerCase() ?? ''
  const attachmentName = attachment.name.toLowerCase()

  const isImage =
    attachmentType.startsWith('image/') || /\.(png|jpe?g|webp|gif|avif)$/.test(attachmentName)
  const isVideo = attachmentType.startsWith('video/') || /\.(mp4|webm|mov)$/.test(attachmentName)
  const isAudio =
    attachmentType.startsWith('audio/') || /\.(mp3|m4a|ogg|wav|flac)$/.test(attachmentName)

  return (
    <div className="mt-3 max-w-xl overflow-hidden rounded-md border border-border bg-muted/25 p-2.5">
      {isImage && (
        <>
          <button
            aria-label={`Enlarge ${attachment.name}`}
            className="block max-w-full cursor-zoom-in rounded-md"
            onClick={() => setDialogOpen(true)}
            type="button"
          >
            {/* biome-ignore lint/performance/noImgElement: ntfy image attachments are dynamic in size and type */}
            <img
              alt={attachment.name}
              className="block h-auto max-h-72 max-w-full rounded-md object-contain"
              decoding="async"
              loading="lazy"
              referrerPolicy="no-referrer"
              src={attachment.url}
            />
          </button>

          <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <DialogContent className="left-4 right-4 w-auto max-w-none translate-x-0 max-h-[calc(100dvh-2rem)] overflow-hidden p-4 sm:left-16 sm:right-16 sm:max-w-none">
              <DialogTitle className="pr-8 text-sm">{attachment.name}</DialogTitle>
              {/* biome-ignore lint/performance/noImgElement: ntfy image attachments are dynamic in size and type */}
              <img
                alt={attachment.name}
                className="mx-auto block h-auto max-h-[calc(100dvh-8rem)] max-w-full object-contain"
                referrerPolicy="no-referrer"
                src={attachment.url}
              />
            </DialogContent>
          </Dialog>
        </>
      )}

      {isVideo && (
        <>
          <div className="relative">
            {/* biome-ignore lint/a11y/useMediaCaption: ntfy video attachments do not provide caption tracks */}
            <video
              className="max-h-72 w-full rounded object-contain"
              controls
              preload="metadata"
              ref={videoRef}
              src={attachment.url}
            >
              Your browser cannot play this attachment.
            </video>

            <Button
              aria-label="Enlarge video"
              className="absolute top-2 right-2 size-8 cursor-pointer bg-background/90 shadow-sm hover:bg-background"
              onClick={() => {
                videoRef.current?.pause()
                setDialogOpen(true)
              }}
              size="icon"
              type="button"
              variant="secondary"
            >
              <Maximize2 className="size-4" />
            </Button>
          </div>

          <Dialog onOpenChange={setDialogOpen} open={dialogOpen}>
            <DialogContent className="left-4 right-4 w-auto max-w-none translate-x-0 max-h-[calc(100dvh-2rem)] overflow-hidden p-4 sm:left-16 sm:right-16 sm:max-w-none">
              <DialogTitle className="pr-8 text-sm">{attachment.name}</DialogTitle>
              {/* biome-ignore lint/a11y/useMediaCaption: ntfy video attachments do not provide caption tracks */}
              <video
                className="mx-auto block max-h-[calc(100dvh-8rem)] w-full max-w-full rounded object-contain"
                controls
                playsInline
                preload="metadata"
                src={attachment.url}
              >
                Your browser cannot play this attachment.
              </video>
            </DialogContent>
          </Dialog>
        </>
      )}

      {isAudio && (
        // biome-ignore lint/a11y/useMediaCaption: ntfy audio attachments do not provide caption tracks
        <audio className="w-full" controls preload="none" src={attachment.url}>
          Your browser cannot play this attachment.
        </audio>
      )}

      <div className="mt-1.5 flex items-center justify-between gap-3 text-[10px] text-muted-foreground">
        <span className="truncate">{attachment.name}</span>

        {attachment.size != null && (
          <span className="shrink-0">
            {Math.max(0, attachment.size / 1024).toLocaleString(undefined, {
              maximumFractionDigits: 1,
            })}{' '}
            KB
          </span>
        )}
      </div>
    </div>
  )
}
