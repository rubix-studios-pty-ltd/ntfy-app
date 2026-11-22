import { type LogsList } from '@/types/logs'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { formatId } from '@/utils/getAction'
import { status, statusStyle } from '@/utils/status'

type Props = {
  log: LogsList['items'][number]
}

export function LogRow({ log }: Props) {
  return (
    <div className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b border-border/40 p-3 last:border-b-0">
      <span className="text-xs">{formatDate(log.createdAt)}</span>

      <div className="flex flex-col gap-0.5 text-sm">
        <span className="truncate font-semibold text-xs">{log.ruleName}</span>

        <div className="h-15 truncate">
          {log.topic && (
            <div>
              <span className="text-[11px] font-semibold">Topic: </span>
              <span className="truncate text-muted-foreground text-[11px]">{log.topic}</span>
            </div>
          )}

          {log.title && (
            <div>
              <span className="text-[11px] font-semibold">Title: </span>
              <span className="truncate text-muted-foreground text-[11px]">{log.title}</span>
            </div>
          )}

          {log.message && (
            <div>
              <span className="text-[11px] font-semibold">Message: </span>
              <span className="truncate text-muted-foreground text-[11px]">{log.message}</span>
            </div>
          )}

          {log.error && (
            <div className="text-red-500">
              <span className="text-[11px] font-semibold">Error: </span>
              <span className="truncate text-muted-foreground text-[11px]">{log.error}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="truncate font-semibold text-xs">{actionType(log.actionType)}</span>

        {log.actionValue && (
          <span className="truncate text-muted-foreground text-[11px]">{log.actionValue}</span>
        )}

        {log.moduleId && (
          <span className="truncate text-muted-foreground text-[11px]">
            {formatId(log.moduleId)}
          </span>
        )}
      </div>

      <div className="font-semibold text-xs">
        <span className={statusStyle(log.status)}>{status(log.status)}</span>
      </div>
    </div>
  )
}
