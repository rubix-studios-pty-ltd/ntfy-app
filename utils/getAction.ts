import { type RulesType } from '@/schema/automation'

export const formatId = (moduleId?: string | null) => {
  if (!moduleId) {
    return ''
  }

  const name = moduleId
    .split('.')
    .at(-1)
    ?.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .trim()

  if (!name) {
    return ''
  }

  return name.charAt(0).toUpperCase() + name.slice(1)
}

export const formatAction = (rule: RulesType) => {
  if (rule.actionType === 'module') {
    return formatId(rule.moduleId)
  }

  return rule.actionValue
}

export const getAction = (rule: RulesType) => {
  if (rule.actionType === 'module') {
    return rule.moduleId
  }

  return rule.actionValue
}
