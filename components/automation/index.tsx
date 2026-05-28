'use client'

import { PencilIcon, PlayIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Modal } from '@/components/automation/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  createRule,
  deleteRule,
  listRules,
  testRule,
  toggleRule,
  updateRule,
} from '@/lib/tauri/automation'
import { type RulesType, ruleSchema } from '@/types/automation'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { getAction } from '@/utils/getAction'
import { matchType } from '@/utils/matchType'
import { baseStatus, status, statusStyle } from '@/utils/status'

export function Automation() {
  const [rules, setRules] = useState<RulesType[]>([])
  const [search, setSearch] = useState('')
  const [editingRule, setEditingRule] = useState<RulesType | null>(null)

  useEffect(() => {
    const loadRules = async () => {
      try {
        const storedRules = await listRules()
        setRules(storedRules)
      } catch {
        toast.error('Failed to load rules')
      }
    }

    void loadRules()
  }, [])

  const searchFilter = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return rules
    }

    return rules.filter((rule) => {
      return [rule.name, rule.topic, rule.matchValue, getAction(rule)].some((value) =>
        String(value ?? '').toLowerCase().includes(query),
      )
    })
  }, [rules, search])

  const handleAddRule = () => {
    setEditingRule(baseStatus())
  }

  const handleEditRule = (rule: RulesType) => {
    setEditingRule(rule)
  }

  const saveRule = async () => {
    if (!editingRule) {
      return
    }

    const parsed = ruleSchema.safeParse(editingRule)

    if (!parsed.success) {
      const error = parsed.error.issues[0]

      toast.error(error?.message ?? 'Invalid rule')
      return
    }

    const exists = rules.some((rule) => rule.id === parsed.data.id)

    try {
      const savedRule = exists ? await updateRule(parsed.data) : await createRule(parsed.data)

      setRules((current) => {
        const ruleExists = current.some((rule) => rule.id === savedRule.id)

        if (!ruleExists) {
          return [savedRule, ...current]
        }

        return current.map((rule) => {
          if (rule.id !== savedRule.id) {
            return rule
          }

          return savedRule
        })
      })

      setEditingRule(null)
      toast.success('Success')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Save failed')
    }
  }

  const handleDeleteRule = async (ruleId: string) => {
    try {
      await deleteRule(ruleId)
      setRules((current) => current.filter((rule) => rule.id !== ruleId))
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Delete failed')
    }
  }

  const handleToggleRule = async (ruleId: string) => {
    try {
      const savedRule = await toggleRule(ruleId)

      setRules((current) => {
        return current.map((rule) => {
          if (rule.id !== savedRule.id) {
            return rule
          }

          return savedRule
        })
      })
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Update failed')
    }
  }

  const handleTestRule = async (ruleId: string) => {
    try {
      const savedRule = await testRule(ruleId)

      setRules((current) => {
        return current.map((rule) => {
          if (rule.id !== savedRule.id) {
            return rule
          }

          return savedRule
        })
      })

      toast.success('Success')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed')
    }
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />

          <Input
            className="border border-white/10 bg-white/5 pl-9 text-slate-50 text-sm xs:text-sm"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Button
          className="cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 text-slate-50 font-semibold"
          onClick={handleAddRule}
        >
          Add
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-white/3">
        <div className="grid grid-cols-[60px_1fr_1.4fr_1.2fr_80px_80px] gap-2 border-b border-white/10 bg-white/4 p-3 text-xs font-semibold text-slate-400">
          <span>Active</span>
          <span>Name</span>
          <span>Trigger</span>
          <span>Action</span>
          <span>Status</span>
          <span aria-hidden="true" />
        </div>

        {searchFilter.map((rule) => (
          <div
            key={rule.id}
            className="grid grid-cols-[60px_1fr_1.4fr_1.2fr_80px_80px] gap-2 items-center border-b border-white/5 p-3 last:border-b-0"
          >
            <Switch
              checked={rule.active}
              onCheckedChange={() => handleToggleRule(rule.id)}
              className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-400/40 data-[state=checked]:bg-emerald-500/20 data-[state=unchecked]:border-white/10 data-[state=unchecked]:bg-white/5 [&>span]:bg-slate-500 data-[state=checked]:[&>span]:bg-emerald-300"
            />

            <span className="text-slate-100 text-sm truncate">{rule.name}</span>

            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-200">Topic: {rule.topic || 'Any'}</span>
              <div className="scrollbar text-slate-500 h-4 overflow-hidden overflow-y-auto truncate">
                {rule.matchValue
                  .split(/\r?\n/)
                  .map((value) => value.trim())
                  .filter((value) => value.length > 0)
                  .map((value, index) => (
                    <span key={`${rule.id}-match-${index}`} className="block">
                      {matchType(rule.matchType)} "{value}"
                    </span>
                  ))}
              </div>
            </div>

            <div className="flex flex-col gap-0.5 text-xs">
              <span className="text-slate-200">{actionType(rule.actionType)}</span>
              <span className="max-w-55 truncate text-slate-500">{getAction(rule)}</span>
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
                onClick={() => handleTestRule(rule.id)}
              >
                <PlayIcon className="size-3.5" />
              </Button>

              <Button
                size="xs"
                variant="ghost"
                className="cursor-pointer text-slate-300 hover:bg-white/5 hover:text-slate-50"
                onClick={() => handleEditRule(rule)}
              >
                <PencilIcon className="size-3.5" />
              </Button>

              <Button
                size="xs"
                variant="ghost"
                className="cursor-pointer text-red-300 hover:bg-red-500/10 hover:text-red-200"
                onClick={() => handleDeleteRule(rule.id)}
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
