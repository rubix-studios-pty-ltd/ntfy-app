import { type ActionType } from '@/schema/automation'

export const actionType = (actionType: ActionType) => {
  switch (actionType) {
    case 'openUrl':
      return 'URL'
    case 'runProgram':
      return 'Program'
    case 'runScript':
      return 'Script'
    case 'module':
      return 'Module'
  }
}

export const actionLabels: Record<ActionType, string> = {
  runProgram: 'Program',
  runScript: 'Script',
  openUrl: 'URL',
  module: 'Module',
}
