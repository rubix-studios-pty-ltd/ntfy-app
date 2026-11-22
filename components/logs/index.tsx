'use client'

import { LogsPagination } from '@/components/logs/pagination'
import { LogsTable } from '@/components/logs/table'
import { useLogs } from '@/hooks/use-logs'

export function Logs() {
  const { logs, changePage } = useLogs()

  return (
    <>
      <LogsTable items={logs.items} />

      <LogsPagination onPageChange={changePage} page={logs.page} totalPages={logs.totalPages} />
    </>
  )
}
