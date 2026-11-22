'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

import { Markdown } from '@/components/ntfy/markdown'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type StoredMessage } from '@/types/ntfy'

type Props = {
  expanded: boolean
  message: StoredMessage['message']
  onToggleExpand: () => void
}

export function Content({ expanded, message, onToggleExpand }: Props) {
  const [canExpand, setCanExpand] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = contentRef.current
    if (!element) return

    const measure = () => {
      setCanExpand(element.scrollHeight > 200)
    }

    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div
        className={cn(
          'min-w-0 mt-2 bg-background p-2 rounded-md',
          expanded ? 'max-h-none overflow-visible' : 'max-h-50 overflow-y-auto overscroll-contain'
        )}
      >
        <div className="flow-root" ref={contentRef}>
          {message.markdown ||
          message.content_type?.split(';')[0].trim().toLowerCase() === 'text/markdown' ? (
            <Markdown content={message.message} />
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap wrap-anywhere text-[11px] leading-[1.8] text-muted-foreground">
              {message.message}
            </p>
          )}
        </div>
      </div>

      {canExpand && (
        <Button
          aria-expanded={expanded}
          className="mt-2 cursor-pointer gap-1 text-[10px] text-muted-foreground hover:text-primary"
          onClick={onToggleExpand}
          size="xs"
          variant="outline"
        >
          {expanded ? (
            <>
              <ChevronUp className="size-3.5" />
              Reduce
            </>
          ) : (
            <>
              <ChevronDown className="size-3.5" />
              Expand
            </>
          )}
        </Button>
      )}
    </>
  )
}
