'use client'

import { PencilIcon, PlayIcon, PlusIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Modal } from '@/components/automation/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { type Rules, ruleSchema } from '@/types/automation'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { matchType } from '@/utils/matchType'
import { baseStatus, status, statusStyle } from '@/utils/status'

export function Automation() {
  const [rules, setRules] = useState<Rules[]>([])
  const [search, setSearch] = useState('')
  const [editingRule, setEditingRule] = useState<Rules | null>(null)

  const blankRule = baseStatus()

  const searchFilter = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return rules
    }

    return rules.filter((rule) => {
      return [rule.name, rule.topic, rule.matchValue, rule.actionValue].some((value) =>
        value.toLowerCase().includes(query)
      )
    })
  }, [rules, search])

  const addRule = () => {
    setEditingRule(blankRule)
  }

  const editRule = (rule: Rules) => {
    setEditingRule(rule)
  }

  const saveRule = () => {
    if (!editingRule) {
      return
    }

    const parsed = ruleSchema.safeParse(editingRule)

    if (!parsed.success) {
      const error = parsed.error.issues[0]

      toast.error(error?.message ?? 'Invalid rule')
      return
    }

    setRules((current) => {
      const exists = current.some((rule) => rule.id === parsed.data.id)

      if (!exists) {
        return [parsed.data, ...current]
      }

      return current.map((rule) => {
        if (rule.id !== parsed.data.id) {
          return rule
        }

        return parsed.data
      })
    })

    setEditingRule(null)
    toast.success('Rule saved')
  }

  const deleteRule = (ruleId: string) => {
    setRules((current) => current.filter((rule) => rule.id !== ruleId))
  }

  const toggleRule = (ruleId: string) => {
    setRules((current) => {
      return current.map((rule) => {
        if (rule.id !== ruleId) {
          return rule
        }

        return {
          ...rule,
          active: !rule.active,
        }
      })
    })
  }

  const testRule = (ruleId: string) => {
    setRules((current) => {
      return current.map((rule) => {
        if (rule.id !== ruleId) {
          return rule
        }

        return {
          ...rule,
          lastRun: new Date().toISOString(),
          status: 'success',
        }
      })
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />

          <Input
            className="border border-white/10 bg-white/5 pl-9 text-slate-50 text-sm xs:text-sm"
            placeholder="Search rules..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Button
          className="cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 font-semibold text-slate-50"
          onClick={addRule}
        >
          <PlusIcon className="size-4" />
          Add Rule
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
        <div className="grid grid-cols-[60px_1.2fr_1.2fr_1.2fr_80px_80px] border-b border-white/10 bg-white/4 p-3 text-xs font-semibold text-slate-400">
          <span>Active</span>
          <span>Name</span>
          <span>Trigger</span>
          <span>Action</span>
          <span>Status</span>
        </div>

        {searchFilter.map((rule) => (
          <div
            key={rule.id}
            className="grid grid-cols-[60px_1.2fr_1.2fr_1.2fr_80px_80px] items-center border-b border-white/5 p-3 last:border-b-0"
          >
            <Switch
              checked={rule.active}
              onCheckedChange={() => toggleRule(rule.id)}
              className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-400/40 data-[state=checked]:bg-emerald-500/20 data-[state=unchecked]:border-white/10 data-[state=unchecked]:bg-white/5 [&>span]:bg-slate-500 data-[state=checked]:[&>span]:bg-emerald-300"
            />

            <span className="text-slate-100 text-sm">{rule.name}</span>

            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-200">Topic: {rule.topic || 'Any'}</span>
              <span className="text-slate-500">
                {matchType(rule.matchType)} "{rule.matchValue}"
              </span>
            </div>

            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-200">{actionType(rule.actionType)}</span>
              <span className="max-w-55 truncate text-slate-500">{rule.actionValue}</span>
            </div>

            <div className="flex flex-col gap-0.5 text-xs">
              <span className={statusStyle(rule.status ?? 'never')}>
                {status(rule.status ?? 'never')}
              </span>
              <span className="text-slate-500">{formatDate(rule.lastRun)}</span>
            </div>

            <div className="flex justify-end gap-0.5">
              <Button
                size="xs"
                variant="ghost"
                className="cursor-pointer text-slate-300 hover:bg-white/5 hover:text-slate-50"
                onClick={() => testRule(rule.id)}
              >
                <PlayIcon className="size-3.5" />
              </Button>

              <Button
                size="xs"
                variant="ghost"
                className="cursor-pointer text-slate-300 hover:bg-white/5 hover:text-slate-50"
                onClick={() => editRule(rule)}
              >
                <PencilIcon className="size-3.5" />
              </Button>

              <Button
                size="xs"
                variant="ghost"
                className="cursor-pointer text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={() => deleteRule(rule.id)}
              >
                <TrashIcon className="size-3.5" />
              </Button>
            </div>
          </div>
        ))}

        {searchFilter.length === 0 && (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            No automation rules found.
          </div>
        )}
      </div>

      <Modal rule={editingRule} setRule={setEditingRule} onSave={saveRule} />
    </>
  )
}
