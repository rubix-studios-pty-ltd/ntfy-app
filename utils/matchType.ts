import { type MatchType } from '@/schema/automation'

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
