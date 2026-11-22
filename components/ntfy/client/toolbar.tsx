import { type Dispatch, type SetStateAction } from 'react'
import { CheckCheck, RefreshCw, Search, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { messageAction, reconnect } from '@/lib/tauri/ntfy'
import { cn } from '@/lib/utils'

type Props = {
  busy: boolean
  confirmDelete: (topicId: string | null) => void
  perform: (action: () => Promise<void>) => Promise<void>
  search: string
  selected: string | null
  setSearch: Dispatch<SetStateAction<string>>
  setUnreadOnly: Dispatch<SetStateAction<boolean>>
  unread: number
  unreadOnly: boolean
}

export function Toolbar({
  busy,
  confirmDelete,
  perform,
  search,
  selected,
  setSearch,
  setUnreadOnly,
  unread,
  unreadOnly,
}: Props) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border">
        <div className="flex gap-2">
          <Button
            className={cn(
              'cursor-pointer transition-all duration-500 h-auto min-w-16 rounded-none border-b-2 p-3 text-[11px] font-normal hover:bg-transparent dark:hover:bg-transparent',
              !unreadOnly
                ? 'border-primary font-[650] text-accent-foreground'
                : 'border-transparent text-muted-foreground'
            )}
            onClick={() => setUnreadOnly(false)}
            variant="ghost"
          >
            All
          </Button>

          <Button
            className={cn(
              'cursor-pointer transition-all duration-500 h-auto min-w-16 rounded-none border-b-2 p-3 text-[11px] font-normal hover:bg-transparent dark:hover:bg-transparent',
              unreadOnly
                ? 'border-primary font-bold text-accent-foreground'
                : 'border-transparent text-muted-foreground'
            )}
            onClick={() => setUnreadOnly(true)}
            variant="ghost"
          >
            Unread{' '}
            {unread > 0 && (
              <span className="ml-1 rounded bg-muted px-1.25 py-0.5 text-[9px]">{unread}</span>
            )}
          </Button>
        </div>

        <div className="flex gap-1.25 items-center">
          <Button
            aria-label="Mark all as read"
            className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
            disabled={busy}
            onClick={() => void perform(() => messageAction(null, selected))}
            size="icon-xs"
            variant="ghost"
          >
            <CheckCheck className="size-4" />
          </Button>

          <Button
            aria-label={
              selected ? 'Delete notifications for this topic' : 'Delete all notifications'
            }
            className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-destructive"
            disabled={busy}
            onClick={() => confirmDelete(selected)}
            size="icon-xs"
            variant="ghost"
          >
            <Trash2 className="size-3.5" />
          </Button>

          <Button
            aria-label="Reconnect subscriptions"
            className="cursor-pointer duration-500 transition-all text-muted-foreground hover:text-primary"
            disabled={busy}
            onClick={() => void perform(reconnect)}
            size="icon-xs"
            variant="ghost"
          >
            <RefreshCw className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="relative my-4.75">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          aria-label="Search notifications"
          className="w-full bg-transparent pl-9 text-[11px] md:text-[11px] text-foreground"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search…"
          type="search"
          value={search}
        />
      </div>
    </>
  )
}
