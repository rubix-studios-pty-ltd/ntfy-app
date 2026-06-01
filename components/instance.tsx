'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { readUrl } from '@/lib/tauri/settings'
import { useStore } from '@/store/instance'
import { startInstance } from '@/utils/startInstance'

export function Instance() {
  const instance = useStore((state) => state.instance)
  const setInstance = useStore((state) => state.setInstance)

  useEffect(() => {
    readUrl().then((savedUrl) => {
      setInstance(savedUrl)

      if (savedUrl) {
        startInstance(savedUrl)
      }
    })
  }, [setInstance])

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        startInstance(instance)
      }}
    >
      <Label className="font-bold">Instance</Label>
      <Input
        className="border border-border"
        name="instanceUrl"
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        value={instance || ''}
        placeholder="https://ntfy.sh"
        required
        onChange={(event) => setInstance(event.target.value.trim())}
      />

      <Button
        className="flex-1 cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500 text-primary-foreground font-semibold"
        type="submit"
      >
        Start
      </Button>
    </form>
  )
}
