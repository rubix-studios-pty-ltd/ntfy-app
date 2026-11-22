import { Button } from '@/components/ui/button'
import { type Snapshot } from '@/types/ntfy'

type Props = {
  busy: boolean
  onReconnect: () => void
  selected: string | null
  status?: Snapshot['statuses'][number]
  statuses: Snapshot['statuses']
}

export function Status({ busy, onReconnect, selected, status, statuses }: Props) {
  return (
    <>
      {status?.detail && (
        <div
          className="flex items-center justify-between gap-3.5 rounded-[7px] border py-2 px-3 text-[11px] leading-xs [&_button]:shrink-0 border-warning-border bg-warning-soft text-warning-foreground"
          role="status"
        >
          {status.detail}
          <Button
            className="cursor-pointer duration-500 transition-all h-6 p-0 text-[11px] font-normal hover:bg-transparent dark:hover:bg-warning-soft dark:hover:text-warning-foreground"
            disabled={busy}
            onClick={onReconnect}
            size="sm"
            variant="ghost"
          >
            Reconnect
          </Button>
        </div>
      )}

      {!selected && statuses.some((entry) => entry.state === 'reconnecting') && (
        <div
          className="flex items-center justify-between gap-3.5 rounded-[7px] border py-2 px-3 text-[11px] leading-xs [&_button]:shrink-0 border-warning-border bg-warning-soft text-warning-foreground"
          role="status"
        >
          Subscriptions reconnecting...
          <Button
            className="cursor-pointer duration-500 transition-all h-6 p-0 text-[11px] font-normal hover:bg-transparent dark:hover:bg-warning-soft dark:hover:text-warning-foreground"
            disabled={busy}
            onClick={onReconnect}
            size="sm"
            variant="ghost"
          >
            Retry
          </Button>
        </div>
      )}
    </>
  )
}
