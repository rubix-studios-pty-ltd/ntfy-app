'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { listRules, ruleLogs } from '@/lib/tauri/automation'
import { type LogsType, type RulesType } from '@/types/automation'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { status, statusStyle } from '@/utils/status'

type LogRow = LogsType & {
  ruleName: string
}

export function Logs() {
  const [logs, setLogs] = useState<LogRow[]>([])

  const loadLogs = useCallback(async ({ notify = false }: { notify?: boolean } = {}) => {
    try {
      const rules = await listRules()

      const results = await Promise.all(
        rules.map(async (rule: RulesType) => {
          const items = await ruleLogs(rule.id)

          return items.map((log) => ({
            ...log,
            ruleName: rule.name,
          }))
        })
      )

      const mergedLogs = results.flat().sort((a, b) => Number(b.createdAt) - Number(a.createdAt))

      setLogs(mergedLogs)
      if (notify) {
        toast.success('Refreshed')
      }
    } catch {
      if (notify) {
        toast.error('Failed to load logs')
      }
    }
  }, [])

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  return (
    <>
      <div className="flex flex-col w-full items-end">
        <Button
          type="button"
          onClick={() => void loadLogs({ notify: true })}
          className="cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 text-slate-50 font-semibold"
        >
          Refresh
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
        <div className="grid grid-cols-[80px_1.4fr_1fr_80px] gap-2 border-b border-white/10 bg-white/4 p-3 text-xs font-semibold text-slate-400">
          <span>Time</span>
          <span>Rule</span>
          <span>Action</span>
          <span>Status</span>
        </div>

        {logs.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-400">
            No automation logs found.
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[80px_1.4fr_1fr_80px] gap-2 border-b border-white/5 p-3 last:border-b-0"
            >
              <span className="text-slate-400 text-xs">{formatDate(log.createdAt)}</span>

              <div className="flex flex-col gap-0.5 text-xs">
                <span className="truncate text-xs text-slate-200">{log.ruleName}</span>

                <div className=" text-slate-500 h-12 truncate">
                  {log.topic ? <span className="block">Topic: {log.topic}</span> : null}
                  {log.title ? <span className="block">Title: {log.title}</span> : null}
                  {log.message ? <span className="block">{log.message}</span> : null}
                  {log.error ? (
                    <span className="block text-red-300">Error: {log.error}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-xs">
                <span className="truncate text-xs text-slate-200">
                  {actionType(log.actionType)}
                </span>
                <span className="mt-1 truncate text-xs text-slate-500">{log.actionValue}</span>
              </div>

              <div className="text-xs">
                <span className={statusStyle(log.status)}>{status(log.status)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
