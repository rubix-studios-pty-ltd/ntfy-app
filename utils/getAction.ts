import { type RulesType } from '@/schema/automation'

export const getAction = (rule: RulesType) => {
  if (rule.actionType === 'module') {
    return rule.moduleId
  }

  return rule.actionValue
}
