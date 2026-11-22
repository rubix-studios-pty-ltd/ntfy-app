'use client'

import { ExternalLink, File } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { type StoredMessage } from '@/types/ntfy'
import { safeLink } from '@/utils/safeLink'

type Props = {
  expired: boolean
  message: StoredMessage['message']
  onOpen: (url: string) => Promise<void>
}

export function Links({ expired, message, onOpen }: Props) {
  if (!message.click && !message.attachment && message.actions.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-3.25 text-[10px] text-primary">
      {safeLink(message.click) && (
        <Button
          className="cursor-pointer duration-500 transition-all h-auto gap-1 p-0 has-[>svg]:px-0 text-[10px] font-normal whitespace-normal"
          onClick={() => void onOpen(message.click as string)}
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
            if (safeLink(url)) void onOpen(url)
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
            onClick={() => void onOpen(action.url as string)}
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
  )
}
