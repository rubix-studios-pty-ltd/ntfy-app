'use client'

import { Button } from '@/components/ui/button'

const refreshEvent = 'refresh'

export function Refresh() {
  return (
    <Button
      onClick={() => window.dispatchEvent(new Event(refreshEvent))}
      className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500"
    >
      Refresh
    </Button>
  )
}
