import { type ActionType } from '@/types/automation'

export const actionType = (actionType: ActionType) => {
  switch (actionType) {
    case 'openUrl':
      return 'Open URL'
    case 'runProgram':
      return 'Run program'
    case 'runScript':
      return 'Run script'
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
