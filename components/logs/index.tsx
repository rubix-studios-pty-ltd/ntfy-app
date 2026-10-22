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
import { getLogs } from '@/lib/tauri/logs'
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
        const result = await getLogs({ page, pageSize })

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
      <div className="border-border bg-card relative rounded-[9px] border shadow-xs">
        <div className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b p-3 text-sm font-bold">
          <span>Time</span>
          <span>Rule</span>
          <span>Action</span>
          <span>Status</span>
        </div>

        <ScrollArea
          className="h-[calc(100vh-12.5em)] overflow-hidden"
          onWheelCapture={(event) => {
            event.stopPropagation()
          }}
        >
          {logs.items.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm">No logs found.</div>
          ) : (
            logs.items.map((log) => (
              <div
                className="grid grid-cols-[130px_minmax(0,1.2fr)_minmax(0,1.2fr)_80px] gap-2 border-b border-border/40 p-3 last:border-b-0"
                key={log.id}
              >
                <span className="text-sm">{formatDate(log.createdAt)}</span>

                <div className="flex flex-col gap-0.5 text-sm">
                  <span className="truncate font-semibold text-xs">{log.ruleName}</span>
                  <div className="h-15 truncate">
                    {log.topic && (
                      <div>
                        <span className="text-[11px] font-semibold">Topic:</span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          {' '}
                          {log.topic}
                        </span>
                      </div>
                    )}
                    {log.title && (
                      <div>
                        <span className="text-[11px] font-semibold">Title:</span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          {' '}
                          {log.title}
                        </span>
                      </div>
                    )}
                    {log.message && (
                      <div>
                        <span className="text-[11px] font-semibold">Message:</span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          {' '}
                          {log.message}
                        </span>
                      </div>
                    )}
                    {log.error && (
                      <div className="text-red-500">
                        <span className="text-[11px] font-semibold">Error:</span>
                        <span className="truncate text-muted-foreground text-[11px]">
                          {' '}
                          {log.error}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="truncate font-semibold text-xs">
                    {actionType(log.actionType)}
                  </span>
                  {log.actionValue && (
                    <span className="truncate text-muted-foreground text-[11px]">
                      {log.actionValue}
                    </span>
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
            ))
          )}
        </ScrollArea>
      </div>

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
