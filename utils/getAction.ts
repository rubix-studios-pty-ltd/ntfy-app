import { type RulesType } from '@/types/automation'

export const getAction = (rule: RulesType) => {
  if (rule.actionType === 'module') {
    return rule.moduleId
  }

  return rule.actionValue
}
