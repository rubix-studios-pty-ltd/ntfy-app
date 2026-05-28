import { type RulesType, type StatusType } from '@/types/automation'

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
      return 'text-emerald-300'
    case 'failed':
      return 'text-red-300'
    case 'never':
      return 'text-slate-400'
  }
}
