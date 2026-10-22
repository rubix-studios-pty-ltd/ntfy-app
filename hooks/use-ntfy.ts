'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { toast } from 'sonner'

import { getMessages, getSnapshot } from '@/lib/tauri/ntfy'
import { type ConnectionStatus, type Snapshot, type StoredMessage } from '@/types/ntfy'

export function useNtfy(topicId: string | null, unreadOnly: boolean, search: string) {
  const queryKey = JSON.stringify([topicId, unreadOnly, search])

  const [view, setView] = useState<{
    query: string | null
    ready: boolean
  }>({
    query: null,
    ready: false,
  })

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const reload = useRef<(() => void) | null>(null)
  const morePending = useRef(false)
  const pageSize = useRef(100)

  const refresh = useCallback(() => reload.current?.(), [])

  const pending = view.query !== queryKey
  const ready = !pending && view.ready

  useEffect(() => {
    pageSize.current = 100
    morePending.current = false

    setHasMore(false)
    setLoadingMore(false)

    let cancelled = false
    let running = false
    let queued = false

    if (!isTauri()) {
      setError(
        'Open the installed Ntfy desktop app to connect. Browser previews cannot access encrypted storage or native notifications.'
      )

      setLoading(false)
      setView({ query: queryKey, ready: false })

      return
    }

    const load = async () => {
      queued = true

      if (running) return

      running = true

      try {
        while (queued && !cancelled) {
          queued = false

          const limit = pageSize.current

          try {
            const nextSnapshot = await getSnapshot()

            if (cancelled) return

            setSnapshot(nextSnapshot)

            const nextMessages: StoredMessage[] = []

            let before: number | null = null
            let fullPage = false

            do {
              const page = await getMessages({
                topicId,
                unreadOnly,
                search,
                before,
              })

              if (cancelled) return

              nextMessages.push(...page)

              before = page.at(-1)?.rowId ?? null
              fullPage = page.length === 100

              if (!fullPage) break
            } while (nextMessages.length < limit)

            setMessages(nextMessages)
            setHasMore(fullPage)
            setError(null)
            setView({ query: queryKey, ready: true })
          } catch (failure) {
            if (!cancelled) {
              setError(String(failure))

              setView((current) => ({
                query: queryKey,
                ready: current.query === queryKey && current.ready,
              }))
            }
          } finally {
            if (!cancelled) {
              setLoading(false)

              if (limit >= pageSize.current) {
                morePending.current = false

                setLoadingMore(false)
              }
            }
          }
        }
      } finally {
        running = false
      }
    }

    const run = () => void load()

    reload.current = run

    run()

    return () => {
      cancelled = true
      reload.current = null
    }
  }, [topicId, unreadOnly, search, queryKey])

  useEffect(() => {
    if (!isTauri()) return

    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined

    const unlisten: (() => void)[] = []

    const retain = (dispose: () => void) => (disposed ? dispose() : unlisten.push(dispose))

    void Promise.all([
      listen('ntfy:changed', () => {
        if (disposed || timer !== undefined) return

        timer = setTimeout(() => {
          timer = undefined

          if (!disposed) refresh()
        }, 150)
      }).then(retain),

      listen<ConnectionStatus>('ntfy:connection', ({ payload }) => {
        if (!disposed) {
          setSnapshot((current) =>
            current
              ? {
                  ...current,
                  statuses: [
                    ...current.statuses.filter((status) => status.topicId !== payload.topicId),
                    payload,
                  ],
                }
              : current
          )
        }
      }).then(retain),

      listen<string>('ntfy:delivery-error', ({ payload }) => {
        if (!disposed) {
          toast.error(payload, { id: 'native-delivery' })
        }
      }).then(retain),
    ])
      .then(() => {
        if (!disposed) refresh()
      })
      .catch((failure) => {
        if (!disposed) {
          setError(String(failure))
        }
      })

    return () => {
      disposed = true

      clearTimeout(timer)

      for (const dispose of unlisten) {
        dispose()
      }
    }
  }, [refresh])

  const loadMore = () => {
    if (morePending.current || !ready || !hasMore) return

    morePending.current = true
    pageSize.current += 100

    setLoadingMore(true)

    refresh()
  }

  return {
    snapshot,
    messages: ready ? messages : [],
    error,
    loading,
    loadingMore,
    pending,
    ready,
    hasMore: ready && hasMore,
    loadMore,
    refresh,
  }
}