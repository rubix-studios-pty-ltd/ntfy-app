'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { DaysOfWeek, defaultSchedule } from '@/constant/schedule'
import { getSchedule, updateSchedule } from '@/lib/tauri/schedule'
import { type DayKey, type Schedule, type ScheduleConfig } from '@/types/schedule'

export function Config() {
  const [scheduleEnabled, setScheduleEnabled] = useState(false)
  const [days, setDays] = useState(defaultSchedule)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSchedule() {
      try {
        const schedule = await getSchedule()

        if (!mounted) {
          return
        }

        setScheduleEnabled(schedule.scheduleEnabled)
        setDays({
          ...defaultSchedule,
          ...schedule.days,
        })
      } catch {
        toast.error('Failed to load schedule')
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadSchedule()

    return () => {
      mounted = false
    }
  }, [])

  const updateConfig = (day: DayKey, updates: Partial<ScheduleConfig>) => {
    setDays((current) => ({
      ...current,
      [day]: {
        ...current[day],
        ...updates,
      },
    }))
  }

  async function saveConfig() {
    if (scheduleEnabled) {
      for (const { key, label } of DaysOfWeek) {
        const day = days[key]

        if (!day.enabled) {
          continue
        }

        if (!day.startTime || !day.endTime) {
          toast.error(`${label} needs a start and end time`)
          return
        }

        if (day.endTime <= day.startTime) {
          toast.error(`${label} end time must be after start time`)
          return
        }
      }
    }

    const config: Schedule = {
      scheduleEnabled,
      days,
    }

    try {
      const updated = await updateSchedule(config)

      setScheduleEnabled(updated.scheduleEnabled)
      setDays({
        ...defaultSchedule,
        ...updated.days,
      })

      toast.success('Config saved')
    } catch {
      toast.error('Failed to save config')
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Label className="font-semibold">Schedule</Label>
          <p className="text-sm">Restrict notification alerts to specific days and times.</p>
        </div>
        <Switch
          checked={scheduleEnabled}
          className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=unchecked]:border-foreground/50 data-[state=unchecked]:bg-accent/50 [&>span]:bg-foreground/50 data-[state=checked]:[&>span]:bg-emerald-600"
          disabled={loading}
          onCheckedChange={setScheduleEnabled}
        />
      </div>

      <div>
        {DaysOfWeek.map(({ key, label }) => {
          const day = days[key]

          return (
            <div
              className="grid grid-cols-[1fr_auto] border-b border-border/10 py-3 last:border-b-0"
              key={key}
            >
              <div className="flex items-center gap-3">
                <Switch
                  checked={day.enabled}
                  className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=unchecked]:border-foreground/50 data-[state=unchecked]:bg-accent/50 [&>span]:bg-foreground/50 data-[state=checked]:[&>span]:bg-emerald-600"
                  disabled={!scheduleEnabled || loading}
                  onCheckedChange={(enabled) => updateConfig(key, { enabled })}
                />

                <Label className="font-medium">{label}</Label>
              </div>

              <div className="flex flex-row space-x-3">
                <div className="space-y-2">
                  <Label className="font-semibold">Start</Label>
                  <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    className="text-sm border border-border col-span-2"
                    disabled={!scheduleEnabled || !day.enabled || loading}
                    id={`${key}-start`}
                    onChange={(event) =>
                      updateConfig(key, {
                        startTime: event.target.value,
                      })
                    }
                    spellCheck={false}
                    type="time"
                    value={day.startTime}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-semibold">End</Label>
                  <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    className="text-sm border border-border col-span-2"
                    disabled={!scheduleEnabled || !day.enabled || loading}
                    id={`${key}-end`}
                    onChange={(event) =>
                      updateConfig(key, {
                        endTime: event.target.value,
                      })
                    }
                    spellCheck={false}
                    type="time"
                    value={day.endTime}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex justify-end">
        <Button
          className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500"
          disabled={loading}
          onClick={saveConfig}
        >
          Save
        </Button>
      </div>
    </div>
  )
}
