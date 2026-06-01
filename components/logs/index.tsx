'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { ScrollArea } from '@/components/ui/scroll-area'
import { listLogs } from '@/lib/tauri/automation'
import { type LogsList } from '@/types/logs'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { formatId } from '@/utils/getAction'
import { getPages } from '@/utils/getPages'
import { status, statusStyle } from '@/utils/status'

const pageSize = 10
const refreshEvent = 'refresh'

const logInitial: LogsList = {
  items: [],
  page: 1,
  pageSize: pageSize,
  total: 0,
  totalPages: 1,
}

export function Logs() {
  const [logs, setLogs] = useState<LogsList>(logInitial)
  const currentPage = useRef(1)

  const pages = useMemo(() => getPages(logs.page, logs.totalPages), [logs.page, logs.totalPages])

  const loadLogs = useCallback(
    async ({
      page = currentPage.current,
      notify = false,
    }: {
      page?: number
      notify?: boolean
    } = {}) => {
      try {
        const result = await listLogs({ page, pageSize })

        currentPage.current = result.page
        setLogs(result)

        if (notify) {
          toast.success('Refreshed')
        }
      } catch {
        if (notify) {
          toast.error('Failed to load logs')
        }
      }
    },
    []
  )

  useEffect(() => {
    void loadLogs()
  }, [loadLogs])

  useEffect(() => {
    const refreshLogs = () => {
      void loadLogs({ notify: true })
    }

    window.addEventListener(refreshEvent, refreshLogs)

    return () => {
      window.removeEventListener(refreshEvent, refreshLogs)
    }
  }, [loadLogs])

  const changePage = (page: number) => {
    if (page < 1 || page > logs.totalPages || page === logs.page) {
      return
    }

    void loadLogs({ page })
  }

  return (
    <>
      <ScrollArea
        className="h-[calc(100vh-155px)] overflow-hidden"
        onWheelCapture={(event) => {
          event.stopPropagation()
        }}
      >
        <div className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b p-3 text-sm font-bold">
          <span>Time</span>
          <span>Rule</span>
          <span>Action</span>
          <span>Status</span>
        </div>

        {logs.items.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm">No logs found.</div>
        ) : (
          logs.items.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b border-border/10 p-3 last:border-b-0"
            >
              <span className="text-sm">{formatDate(log.createdAt)}</span>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className="truncate font-semibold">{log.ruleName}</span>

                <div className="h-15 truncate">
                  {log.topic ? (
                    <span className="block text-muted-foreground">Topic: {log.topic}</span>
                  ) : null}
                  {log.title ? (
                    <span className="block text-muted-foreground">Title: {log.title}</span>
                  ) : null}
                  {log.message ? <span className="block">{log.message}</span> : null}
                  {log.error ? (
                    <span className="block text-red-500">Error: {log.error}</span>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className="truncate font-semibold">{actionType(log.actionType)}</span>
                {log.actionValue && <span className="truncate">{log.actionValue}</span>}
                {log.moduleId && <span className="truncate">{formatId(log.moduleId)}</span>}
              </div>

              <div className="text-sm font-semibold">
                <span className={statusStyle(log.status)}>{status(log.status)}</span>
              </div>
            </div>
          ))
        )}
      </ScrollArea>

      {logs.totalPages > 1 ? (
        <Pagination>
          <PaginationContent>
            {pages.map((page) =>
              typeof page === 'number' ? (
                <PaginationItem key={page}>
                  <PaginationLink
                    href="#"
                    isActive={page === logs.page}
                    onClick={(event) => {
                      event.preventDefault()
                      changePage(page)
                    }}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ) : (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              )
            )}
          </PaginationContent>
        </Pagination>
      ) : null}
    </>
  )
}
