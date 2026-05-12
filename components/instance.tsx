'use client'

import { useEffect } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useStore } from '@/store/instance'
import { readUrl } from '@/utils/readUrl'
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
      <div className="grid gap-4">
        <Label className="font-bold text-slate-200">Instance</Label>
        <Input
          className="border border-white/10 bg-white/5 text-slate-50 outline-none transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/15"
          name="instanceUrl"
          type="url"
          inputMode="url"
          autoComplete="url"
          spellCheck={false}
          value={instance || ''}
          placeholder="https://ntfy.sh"
          required
          onChange={(event) => setInstance(event.target.value)}
        />

        <Button
          className="flex-1 cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 text-slate-50 font-semibold"
          type="submit"
        >
          Start
        </Button>
      </div>
    </form>
  )
}
