'use client'

import { useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export function BackButton() {
  const [back, setBack] = useState(false)

  useEffect(() => {
    const navigation = window.navigation
    let frame: number | null = null

    const update = () => {
      if (frame !== null) cancelAnimationFrame(frame)

      frame = requestAnimationFrame(() => {
        frame = null
        setBack(navigation?.canGoBack ?? window.history.length > 1)
      })
    }

    update()

    navigation?.addEventListener('currententrychange', update)
    window.addEventListener('popstate', update)
    window.addEventListener('pageshow', update)

    return () => {
      if (frame !== null) cancelAnimationFrame(frame)

      navigation?.removeEventListener('currententrychange', update)
      window.removeEventListener('popstate', update)
      window.removeEventListener('pageshow', update)
    }
  }, [])

  if (!back) return null

  return (
    <Button
      className="cursor-pointer duration-500 transition-all"
      onClick={() => window.location.assign('/')}
      size="icon-xs"
      type="button"
    >
      <ArrowLeft />
    </Button>
  )
}
