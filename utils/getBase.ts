import { type RulesType } from '@/types/automation'

export const getBase = (rule: RulesType) => ({
  id: rule.id,
  active: rule.active,
  name: rule.name,
  topic: rule.topic,
  matchType: rule.matchType,
  matchValue: rule.matchValue,
  lastRun: rule.lastRun,
  status: rule.status,
})
