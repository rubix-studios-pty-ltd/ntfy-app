'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { toast } from 'sonner'

import { getMessages, getSnapshot } from '@/lib/tauri/ntfy'
import { type ConnectionStatus, type Snapshot, type StoredMessage } from '@/types/ntfy'

type LoadMode = 'latest' | 'reset'

export function useNtfy(topicId: string | null, unreadOnly: boolean, search: string) {
  const queryKey = JSON.stringify([topicId, unreadOnly, search])

  const [view, setView] = useState<{ query: string | null; ready: boolean }>({
    query: null,
    ready: false,
  })

  const [snapshot, setSnapshot] = useState<Snapshot | null>(null)
  const [messages, setMessages] = useState<StoredMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  const loaded = useRef<StoredMessage[]>([])
  const morePending = useRef(false)
  const bottomHasMore = useRef(false)
  const reload = useRef<((reset: boolean) => void) | null>(null)
  const fetchMore = useRef<(() => void) | null>(null)

  const refresh = useCallback((reset = true) => reload.current?.(reset), [])
  const loadMore = useCallback(() => fetchMore.current?.(), [])
  const pending = view.query !== queryKey
  const ready = !pending && view.ready

  useEffect(() => {
    loaded.current = []
    morePending.current = false
    bottomHasMore.current = false

    setMessages([])
    setHasMore(false)
    setLoading(true)
    setLoadingMore(false)

    let cancelled = false
    let running = false
    let queued: LoadMode | null = null
    let revision = 0

    if (!isTauri()) {
      setError(
        'Open the installed Ntfy desktop app to connect. Browser previews cannot access encrypted storage or native notifications.'
      )
      setLoading(false)
      setView({ query: queryKey, ready: false })
      return
    }

    const load = async (mode: LoadMode) => {
      if (mode === 'reset') revision++
      queued = queued === 'reset' || mode === 'reset' ? 'reset' : 'latest'

      if (running) return
      running = true

      try {
        while (queued && !cancelled) {
          const nextMode = queued
          queued = null

          try {
            const [nextSnapshot, head] = await Promise.all([
              getSnapshot(),
              getMessages({ topicId, unreadOnly, search, before: null }),
            ])
            if (cancelled) return

            setSnapshot(nextSnapshot)

            const oldestHead = head.at(-1)?.rowId ?? Number.POSITIVE_INFINITY
            const tail =
              nextMode === 'latest' && head.length === 20
                ? loaded.current.filter((item) => item.rowId < oldestHead)
                : []
            const merged = [...head, ...tail]
            loaded.current = merged

            setMessages(merged)

            if (nextMode === 'reset' || head.length < 20) {
              bottomHasMore.current = head.length === 20
            }

            setHasMore(bottomHasMore.current)
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
            if (!cancelled) setLoading(false)
          }
        }
      } finally {
        running = false
      }
    }

    reload.current = (reset) => void load(reset ? 'reset' : 'latest')

    fetchMore.current = () => {
      if (running || morePending.current || !bottomHasMore.current || !loaded.current.length) {
        return
      }

      morePending.current = true
      setLoadingMore(true)

      const before = loaded.current.at(-1)?.rowId ?? null
      const requestRevision = revision

      void getMessages({ topicId, unreadOnly, search, before })
        .then((page) => {
          if (cancelled || requestRevision !== revision) return
          const rows = new Map(loaded.current.map((item) => [item.rowId, item]))

          for (const item of page) rows.set(item.rowId, item)

          const merged = [...rows.values()].sort((a, b) => b.rowId - a.rowId)
          loaded.current = merged
          setMessages(merged)

          bottomHasMore.current = page.length === 100
          setHasMore(bottomHasMore.current)
        })
        .catch((failure) => {
          if (!cancelled) setError(String(failure))
        })
        .finally(() => {
          if (!cancelled) {
            morePending.current = false
            setLoadingMore(false)
          }
        })
    }

    void load('reset')

    return () => {
      cancelled = true
      reload.current = null
      fetchMore.current = null
    }
  }, [topicId, unreadOnly, search, queryKey])

  useEffect(() => {
    if (!isTauri()) return

    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    let firstChange = 0
    let pendingReset = false

    const unlisten: (() => void)[] = []
    const retain = (dispose: () => void) => (disposed ? dispose() : unlisten.push(dispose))

    void Promise.all([
      listen<string>('ntfy:changed', ({ payload }) => {
        if (disposed) return
        pendingReset ||= payload === 'reset'

        if (!timer) firstChange = Date.now()
        clearTimeout(timer)

        const delay = Math.max(0, Math.min(200, 1000 - (Date.now() - firstChange)))

        timer = setTimeout(() => {
          timer = undefined
          if (disposed) return
          const reset = pendingReset
          pendingReset = false
          refresh(reset)
        }, delay)
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
        if (!disposed) toast.error(payload, { id: 'native-delivery' })
      }).then(retain),
    ])
      .then(() => {
        if (!disposed) refresh(false)
      })
      .catch((failure) => {
        if (!disposed) setError(String(failure))
      })

    return () => {
      disposed = true
      clearTimeout(timer)
      for (const dispose of unlisten) dispose()
    }
  }, [refresh])

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
