'use client'

import { type KeyboardEvent, useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { defaultHotkeys, hotkeyActions } from '@/lib/constant/hotkeys'
import { shortcutEvent } from '@/lib/hotkeys'
import { getHotkeys, updateHotkeys } from '@/lib/tauri/hotkeys'
import { type Action, type Settings } from '@/types/hotkeys'

export function Hotkeys() {
  const [settings, setSettings] = useState<Settings>(defaultHotkeys)
  const [recording, setRecording] = useState<Action | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let active = true

    void getHotkeys()
      .then((saved) => {
        if (active) setSettings(saved)
      })
      .catch((error) => {
        if (active) toast.error(`Cannot load hotkeys: ${String(error)}`)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const update = (key: Action, shortcut: string) => {
    setSettings((current) => ({ ...current, [key]: shortcut }))
  }

  const values = Object.values(settings)
  const duplicate = new Set(values).size !== values.length

  async function save() {
    if (duplicate || recording || loading || saving) return

    setSaving(true)
    try {
      const saved = await updateHotkeys(settings)
      setSettings(saved)
      toast.success('Hotkeys saved')
    } catch (error) {
      toast.error(String(error))
    } finally {
      setSaving(false)
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, key: Action) => {
    if (recording !== key) return

    event.preventDefault()
    event.stopPropagation()

    if (event.key === 'Escape') {
      setRecording(null)
      return
    }

    const shortcut = shortcutEvent(event.nativeEvent)
    if (!shortcut) return

    if (shortcut === 'Tab' && key !== 'nextTopic') {
      toast.error('Unmodified Tab is reserved for Next topic')
      return
    }

    if (shortcut !== 'Tab' && !/^(Ctrl|Alt|Meta)\+/.test(shortcut)) {
      toast.error('Use Ctrl, Alt or Meta with the shortcut')
      return
    }

    update(key, shortcut)
    setRecording(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[9px] border border-border bg-card p-6 shadow-xs">
        <div className="divide-y divide-border/60">
          {hotkeyActions.map(({ key, name, description }) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0"
              key={key}
            >
              <div className="min-w-0 flex-1 space-y-1">
                <Label className="text-xs font-medium" htmlFor={`hotkey-${key}`}>
                  {name}
                </Label>
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  aria-label={`Set ${name} shortcut`}
                  aria-pressed={recording === key}
                  className="min-w-35 cursor-pointer justify-center font-mono text-[11px]"
                  disabled={loading || saving}
                  id={`hotkey-${key}`}
                  onBlur={() => setRecording((current) => (current === key ? null : current))}
                  onClick={() => setRecording(key)}
                  onKeyDown={(event) => handleKeyDown(event, key)}
                  size="sm"
                  type="button"
                  variant={recording === key ? 'default' : 'outline'}
                >
                  {recording === key ? 'Press shortcut…' : settings[key]}
                </Button>

                <Button
                  aria-label={`Reset ${name} to default`}
                  className="cursor-pointer text-muted-foreground"
                  disabled={loading || saving}
                  onClick={() => update(key, defaultHotkeys[key])}
                  size="icon-xs"
                  title="Reset to default"
                  type="button"
                  variant="ghost"
                >
                  <RotateCcw className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {duplicate && (
        <p className="text-[11px] text-destructive" role="alert">
          Each action must use a different shortcut.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button
          className="cursor-pointer"
          disabled={loading || saving}
          onClick={() => {
            setSettings(defaultHotkeys)
            setRecording(null)
          }}
          size="sm"
          type="button"
          variant="outline"
        >
          Reset
        </Button>

        <Button
          className="cursor-pointer"
          disabled={loading || saving || duplicate || recording !== null}
          onClick={() => void save()}
          size="sm"
          type="button"
        >
          Save
        </Button>
      </div>
    </div>
  )
}
