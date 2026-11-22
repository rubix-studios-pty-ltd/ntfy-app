import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { getLogs } from '@/lib/tauri/logs'
import { type LogsList } from '@/types/logs'

const pageSize = 10
const refreshEvent = 'refresh'

const initialLogs: LogsList = {
  items: [],
  page: 1,
  pageSize,
  total: 0,
  totalPages: 1,
}

type LoadOptions = {
  page?: number
  notify?: boolean
}

export function useLogs() {
  const [logs, setLogs] = useState<LogsList>(initialLogs)
  const currentPage = useRef(1)
  const requestId = useRef(0)

  const loadLogs = useCallback(
    async ({ page = currentPage.current, notify = false }: LoadOptions = {}) => {
      const request = ++requestId.current

      try {
        const result = await getLogs({ page, pageSize })
        if (request !== requestId.current) return

        currentPage.current = result.page
        setLogs(result)

        if (notify) toast.success('Refreshed')
      } catch {
        if (notify && request === requestId.current) {
          toast.error('Failed to load logs')
        }
      }
    },
    []
  )

  useEffect(() => {
    const refreshLogs = () => {
      void loadLogs({ notify: true })
    }

    void loadLogs()
    window.addEventListener(refreshEvent, refreshLogs)

    return () => {
      window.removeEventListener(refreshEvent, refreshLogs)
      requestId.current += 1
    }
  }, [loadLogs])

  const changePage = (page: number) => {
    if (page < 1 || page > logs.totalPages || page === logs.page) return
    void loadLogs({ page })
  }

  return { logs, changePage }
}
