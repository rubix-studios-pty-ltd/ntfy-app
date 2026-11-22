import { type Dispatch, type SetStateAction } from 'react'
import { Bell, BellOff, Pencil, Send, Unplug } from 'lucide-react'

import { TopicIcon } from '@/components/ntfy/topic-icon'
import { Button } from '@/components/ui/button'
import { updateTopic } from '@/lib/tauri/ntfy'
import { type DialogState, type Topic } from '@/types/ntfy'

type Props = {
  busy: boolean
  disconnect: (topic: Topic) => void
  hasTopics: boolean
  onOpenTopic: (topic?: Topic) => void
  perform: (action: () => Promise<void>) => Promise<void>
  setDialog: Dispatch<SetStateAction<DialogState>>
  topic?: Topic
}

export function Header({
  busy,
  disconnect,
  hasTopics,
  onOpenTopic,
  perform,
  setDialog,
  topic,
}: Props) {
  return (
    <header className="flex items-center justify-between gap-3 pb-2">
      {topic ? (
        <div className="flex min-w-0 items-center gap-2 text-foreground">
          <TopicIcon aria-hidden="true" className="size-4 shrink-0" name={topic.icon} />
          <span className="truncate font-medium">{topic.displayName || topic.topic}</span>
        </div>
      ) : (
        <span />
      )}

      <div className="flex items-center gap-2.25">
        {topic && (
          <>
            <Button
              className="cursor-pointer duration-500 transition-all border-border bg-card enabled:hover:bg-accent"
              disabled={busy}
              onClick={() => void perform(() => updateTopic(topic.id, !topic.muted))}
              size="icon-xs"
              variant="outline"
            >
              {topic.muted ? <Bell className="size-2.5" /> : <BellOff className="size-2.5" />}
            </Button>

            <Button
              aria-label="Edit topic"
              className="cursor-pointer border-border bg-card transition-all duration-500 enabled:hover:bg-accent"
              onClick={() => onOpenTopic(topic)}
              size="icon-xs"
              variant="outline"
            >
              <Pencil className="size-2.5" />
            </Button>

            <Button
              className="cursor-pointer duration-500 transition-all border-border bg-card enabled:hover:bg-accent"
              onClick={() => disconnect(topic)}
              size="icon-xs"
              variant="outline"
            >
              <Unplug className="size-2.5" />
            </Button>
          </>
        )}

        <Button
          aria-label="Publish a notification"
          className="cursor-pointer duration-500 transition-all rounded-md border border-primary enabled:hover:bg-primary-hover"
          disabled={!hasTopics}
          onClick={() => setDialog({ kind: 'publish' })}
          size="icon-xs"
          variant="default"
        >
          <Send className="size-2.5" />
        </Button>
      </div>
    </header>
  )
}
