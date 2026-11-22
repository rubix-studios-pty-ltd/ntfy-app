import { useEffect, useState } from 'react'
import { isTauri } from '@tauri-apps/api/core'

import { preference } from '@/lib/tauri/ntfy'

export function useTags() {
  const [showTags, setShowTags] = useState(true)

  useEffect(() => {
    if (!isTauri()) return

    let active = true

    void preference()
      .then((saved) => {
        if (active) setShowTags(saved.showTags)
      })
      .catch((failure) => console.error('Cannot load tag emoji preference', failure))

    return () => {
      active = false
    }
  }, [])

  return [showTags, setShowTags] as const
}
