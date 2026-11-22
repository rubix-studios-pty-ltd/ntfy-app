'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import {
  createRule,
  getRules,
  deleteRule as removeRule,
  testRule as runRule,
  toggleRule as setRuleActive,
  updateRule,
} from '@/lib/tauri/automation'
import { getSnapshot } from '@/lib/tauri/ntfy'
import { type RulesType, ruleSchema } from '@/schema/automation'
import { type Server } from '@/types/ntfy'

function replaceRule(rules: RulesType[], saved: RulesType) {
  return rules.map((rule) => (rule.id === saved.id ? saved : rule))
}

export function useRules() {
  const [rules, setRules] = useState<RulesType[]>([])
  const [servers, setServers] = useState<Server[]>([])

  useEffect(() => {
    let active = true

    void Promise.all([getRules(), getSnapshot()])
      .then(([storedRules, snapshot]) => {
        if (!active) return

        setRules(storedRules)
        setServers(snapshot.servers)
      })
      .catch(() => {
        if (active) toast.error('Failed to load rules')
      })

    return () => {
      active = false
    }
  }, [])

  const saveRule = async (rule: RulesType): Promise<boolean> => {
    const parsed = ruleSchema.safeParse(rule)

    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? 'Invalid rule')
      return false
    }

    const exists = rules.some((item) => item.id === parsed.data.id)

    try {
      const saved = exists ? await updateRule(parsed.data) : await createRule(parsed.data)

      setRules((current) =>
        current.some((item) => item.id === saved.id)
          ? replaceRule(current, saved)
          : [saved, ...current]
      )
      toast.success('Success')
      return true
    } catch {
      toast.error('Save failed')
      return false
    }
  }

  const deleteRule = async (ruleId: string): Promise<boolean> => {
    try {
      await removeRule(ruleId)
      setRules((current) => current.filter((rule) => rule.id !== ruleId))
      toast.success('Deleted')
      return true
    } catch {
      toast.error('Delete failed')
      return false
    }
  }

  const toggleRule = async (ruleId: string): Promise<void> => {
    try {
      const saved = await setRuleActive(ruleId)
      setRules((current) => replaceRule(current, saved))
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Update failed')
    }
  }

  const testRule = async (rule: RulesType): Promise<void> => {
    try {
      const saved = await runRule({
        ruleId: rule.id,
        message: rule.matchValue,
        title: rule.name,
      })

      setRules((current) => replaceRule(current, saved))
      toast.success('Success')
    } catch (error) {
      console.error('Failed:', error)
      toast.error('Failed')
    }
  }

  return { rules, servers, saveRule, deleteRule, toggleRule, testRule }
}
