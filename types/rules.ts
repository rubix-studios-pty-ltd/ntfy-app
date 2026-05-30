import { type RulesType } from '@/schema/automation'

export type ExportRules = RulesType & {
  createdAt?: string
  updatedAt?: string
}