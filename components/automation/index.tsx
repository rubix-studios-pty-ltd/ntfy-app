'use client'

import { useEffect, useMemo, useState } from 'react'
import { PencilIcon, PlayIcon, SearchIcon, TrashIcon } from 'lucide-react'
import { toast } from 'sonner'

import { Modal } from '@/components/automation/modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import {
  createRule,
  deleteRule,
  getRules,
  testRule,
  toggleRule,
  updateRule,
} from '@/lib/tauri/automation'
import { type RulesType, ruleSchema } from '@/schema/automation'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { formatAction, getAction } from '@/utils/getAction'
import { matchType } from '@/utils/matchType'
import { baseStatus, status, statusStyle } from '@/utils/status'

export function Automation() {
  const [rules, setRules] = useState<RulesType[]>([])
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<RulesType | null>(null)
  const [remove, setRemove] = useState<RulesType | null>(null)

  useEffect(() => {
    const loadRules = async () => {
      try {
        const storedRules = await getRules()
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
    setEditing(baseStatus())
  }

  const handleEditRule = (rule: RulesType) => {
    setEditing(rule)
  }

  const saveRule = async () => {
    if (!editing) {
      return
    }

    const parsed = ruleSchema.safeParse(editing)

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

      setEditing(null)
      toast.success('Success')
    } catch {
      toast.error('Save failed')
    }
  }

  const handleDelete = async () => {
    if (!remove) {
      return
    }

    try {
      await deleteRule(remove.id)

      setRules((current) => current.filter((rule) => rule.id !== remove.id))
      setRemove(null)

      toast.success('Deleted')
    } catch {
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

  const handleTestRule = async (rule: RulesType) => {
    try {
      const savedRule = await testRule({
        ruleId: rule.id,
        message: rule.matchValue,
        title: rule.name,
      })

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
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search..."
            value={search}
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
              className="grid grid-cols-[60px_0.8fr_minmax(0,1.2fr)_minmax(0,1.2fr)_100px_80px] gap-2 border-b border-border/10 p-3 last:border-b-0"
              key={rule.id}
            >
              <Switch
                checked={rule.active}
                className="cursor-pointer border border-white/10 bg-white/5 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=unchecked]:border-foreground/50 data-[state=unchecked]:bg-accent/50 [&>span]:bg-foreground/50 data-[state=checked]:[&>span]:bg-emerald-600"
                onCheckedChange={() => handleToggleRule(rule.id)}
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
                      <span className="block truncate" key={`${rule.id}-match-${index}`}>
                        {matchType(rule.matchType)}: {value}
                      </span>
                    ))}
                </div>
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className="font-semibold">{actionType(rule.actionType)}</span>
                <span className="block min-w-0 truncate">{formatAction(rule)}</span>
              </div>

              <div className="flex flex-col gap-0.5 text-sm">
                <span className={statusStyle(rule.status ?? 'never')}>
                  {status(rule.status ?? 'never')}
                </span>
                <span className="text-muted-foreground text-xs">{formatDate(rule.lastRun)}</span>
              </div>

              <div className="flex justify-end gap-0.5">
                <Button
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => handleTestRule(rule)}
                  size="xs"
                  variant="ghost"
                >
                  <PlayIcon className="size-3.5" />
                </Button>

                <Button
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => handleEditRule(rule)}
                  size="xs"
                  variant="ghost"
                >
                  <PencilIcon className="size-3.5" />
                </Button>

                <Button
                  className="cursor-pointer text-muted-foreground transition-all duration-500"
                  onClick={() => setRemove(rule)}
                  size="xs"
                  variant="ghost"
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

      <AlertDialog onOpenChange={(open) => !open && setRemove(null)} open={remove !== null}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete automation "{remove?.name}" and all associated data. This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>

            <AlertDialogAction
              className="cursor-pointer text-destructive-foreground hover:bg-destructive/90"
              onClick={(event) => {
                event.preventDefault()
                void handleDelete()
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Modal onSave={saveRule} rule={editing} setRule={setEditing} />
    </div>
  )
}
