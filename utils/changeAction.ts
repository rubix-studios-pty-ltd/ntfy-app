import { type ActionType, type RulesType } from '@/schema/automation'
import { getBase } from '@/utils/getBase'

export function changeAction(rule: RulesType, actionType: ActionType): RulesType {
  const baseRule = getBase(rule)

  if (actionType === 'module') {
    return {
      ...baseRule,
      actionType,
      moduleId: '',
      actionConfig: {},
    }
  }

  if (actionType === 'runProgram') {
    return {
      ...baseRule,
      actionType,
      actionValue: '',
      arguments: undefined,
      workingDirectory: undefined,
    }
  }

  return {
    ...baseRule,
    actionType,
    actionValue: '',
  }
}
