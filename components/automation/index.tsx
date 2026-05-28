'use client'

import { PencilIcon, PlayIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

import { Modal } from '@/components/automation/modal'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  createRule,
  deleteRule,
  listRules,
  testRule,
  toggleRule,
  updateRule,
} from '@/lib/tauri/automation'
import { type RulesType, ruleSchema } from '@/schema/automation'
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
        String(value ?? '')
          .toLowerCase()
          .includes(query)
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2" />

          <Input
            className="pl-9 border-border text-sm xs:text-sm"
            placeholder="Search..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <Button
          className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500"
          onClick={handleAddRule}
        >
          Add
        </Button>
      </div>

      <div>
        <div className="grid grid-cols-[60px_0.8fr_minmax(0,1.2fr)_minmax(0,1.2fr)_100px_80px] gap-2 border-b p-3 text-sm font-bold">
          <span>Active</span>
          <span>Name</span>
          <span>Trigger</span>
          <span>Action</span>
          <span>Status</span>
          <span aria-hidden="true" />
        </div>

        <ScrollArea
          className="h-[calc(100vh-186px)] overflow-hidden"
          onWheelCapture={(event) => {
            event.stopPropagation()
          }}
        >
          {searchFilter.map((rule) => (
            <div
              key={rule.id}
              className="grid grid-cols-[60px_0.8fr_minmax(0,1.2fr)_minmax(0,1.2fr)_100px_80px] gap-2 border-b border-border/10 p-3 last:border-b-0"
            >
              <Switch
                checked={rule.active}
                onCheckedChange={() => handleToggleRule(rule.id)}
                className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=unchecked]:border-foreground/50 data-[state=unchecked]:bg-accent/50 [&>span]:bg-foreground/50 data-[state=checked]:[&>span]:bg-emerald-600"
              />

              <span className="text-sm truncate">{rule.name}</span>

              <div className="flex flex-col gap-0.5 text-sm">
                <span>Topic: {rule.topic}</span>
                <div className="scrollbar h-6 overflow-hidden overflow-y-auto truncate">
                  {rule.matchValue
                    .split(/\r?\n/)
                    .map((value) => value.trim())
                    .filter((value) => value.length > 0)
                    .map((value, index) => (
                      <span key={`${rule.id}-match-${index}`} className="block truncate">
                        {matchType(rule.matchType)}: {value}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-semibold">{actionType(rule.actionType)}</span>
                <span className="block min-w-0 truncate">{getAction(rule)}</span>
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className={statusStyle(rule.status ?? 'never')}>
                  {status(rule.status ?? 'never')}
                </span>
                <span className="text-muted-foreground text-xs">{formatDate(rule.lastRun)}</span>
              </div>

              <div className="flex justify-end gap-0.5">
                <Button
                  size="xs"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => handleTestRule(rule.id)}
                >
                  <PlayIcon className="size-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => handleEditRule(rule)}
                >
                  <PencilIcon className="size-3.5" />
                </Button>

                <Button
                  size="xs"
                  variant="ghost"
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => handleDeleteRule(rule.id)}
                >
                  <TrashIcon className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}

          {searchFilter.length === 0 && (
            <div className="px-4 py-10 text-center text-sm">No automation rules found.</div>
          )}
        </ScrollArea>
      </div>

      <Modal rule={editingRule} setRule={setEditingRule} onSave={saveRule} />
    </div>
  )
}
