'use client'

import { useEffect, useId, useState } from 'react'
import { useTheme } from 'next-themes'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function ThemeSelect() {
  const id = useId()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex items-center justify-between gap-4 text-xs">
      <Label className="text-xs font-semibold" htmlFor={id}>
        Appearance
      </Label>

      <Select
        disabled={!mounted}
        onValueChange={setTheme}
        value={mounted ? (theme ?? 'system') : 'system'}
      >
        <SelectTrigger
          className="cursor-pointer duration-500 transition-all w-36 border-border bg-card text-xs text-foreground"
          id={id}
        >
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>

        <SelectContent position="popper">
          <SelectItem className="cursor-pointer transition-all duration-500" value="system">
            System
          </SelectItem>
          <SelectItem className="cursor-pointer transition-all duration-500" value="light">
            Light
          </SelectItem>
          <SelectItem className="cursor-pointer transition-all duration-500" value="dark">
            Dark
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
