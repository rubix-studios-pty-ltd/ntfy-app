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
          className="cursor-pointer duration-500 transition-all gap-1 has-[>svg]:px-2 py-1 text-[10px] font-normal whitespace-normal"
          onClick={() => void onOpen(message.click as string)}
          size="xs"
          variant="outline"
        >
          <ExternalLink className="size-3" />
          Link
        </Button>
      )}

      {message.attachment && safeLink(message.attachment.url) && (
        <Button
          className="cursor-pointer duration-500 transition-all gap-1 has-[>svg]:px-2 py-1 text-[10px] font-normal whitespace-normal"
          disabled={expired}
          onClick={() => {
            const url = message.attachment?.url
            if (safeLink(url)) void onOpen(url)
          }}
          size="xs"
          variant="outline"
        >
          <File className="size-3" />
          {message.attachment.name}
          {expired ? ' (expired)' : ''}
        </Button>
      )}

      {message.actions.map((action, index) =>
        action && action.action === 'view' && safeLink(action.url) ? (
          <Button
            className="cursor-pointer duration-500 transition-all gap-1 has-[>svg]:px-2 py-1 text-[10px] font-normal whitespace-normal"
            key={`${action.label}-${index}`}
            onClick={() => void onOpen(action.url as string)}
            size="xs"
            variant="outline"
          >
            <ExternalLink className="size-3" />
            {action.label || 'Open'}
          </Button>
        ) : action && action.action === 'copy' && typeof action.value === 'string' ? (
          <Button
            className="cursor-pointer duration-500 transition-all gap-1 has-[>svg]:px-2 py-1 text-[10px] font-normal whitespace-normal"
            key={`${action.label}-${index}`}
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(action.value as string)
                toast.success('Copied')
              } catch {
                toast.error('Cannot access the clipboard')
              }
            }}
            size="xs"
            variant="outline"
          >
            {action.label || 'Copy'}
          </Button>
        ) : null
      )}
    </div>
  )
}
