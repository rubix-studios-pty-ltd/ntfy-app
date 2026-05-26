import { type MatchType } from '@/types/automation'

export const matchType = (matchType: MatchType) => {
  switch (matchType) {
    case 'equals':
      return 'Equals'
    case 'contains':
      return 'Contains'
    case 'startsWith':
      return 'Starts with'
  }
}
