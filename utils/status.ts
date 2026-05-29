import { type RulesType, type StatusType } from '@/schema/automation'

export const baseStatus = (): RulesType => {
  return {
    id: crypto.randomUUID(),
    active: true,
    name: '',
    topic: '',
    matchType: 'equals',
    matchValue: '',
    actionType: 'runProgram',
    actionValue: '',
    arguments: undefined,
    workingDirectory: undefined,
    status: 'never',
  }
}

export const status = (status: StatusType) => {
  switch (status) {
    case 'success':
      return 'Success'
    case 'failed':
      return 'Failed'
    case 'never':
      return 'Never ran'
  }
}

export const statusStyle = (status: StatusType) => {
  switch (status) {
    case 'success':
      return 'font-semibold text-emerald-600'
    case 'failed':
      return 'font-semibold text-red-600'
    case 'never':
      return 'font-semibold'
  }
}
