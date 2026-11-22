import { ScrollArea } from '@/components/ui/scroll-area'
import { type LogsList } from '@/types/logs'
import { LogRow } from './row'

type Props = {
  items: LogsList['items']
}

export function LogsTable({ items }: Props) {
  return (
    <div className="border-border bg-card relative rounded-[9px] border shadow-xs">
      <div className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b p-3 text-sm font-bold">
        <span>Time</span>
        <span>Rule</span>
        <span>Action</span>
        <span>Status</span>
      </div>

      <ScrollArea
        className="h-[calc(100vh-13.5em)] overflow-hidden"
        onWheelCapture={(event) => event.stopPropagation()}
      >
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm">No logs found.</div>
        ) : (
          items.map((log) => <LogRow key={log.id} log={log} />)
        )}
      </ScrollArea>
    </div>
  )
}
