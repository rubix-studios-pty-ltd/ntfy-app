import { type RulesType } from '@/schema/automation'
import { type Server } from '@/types/ntfy'

export type ModalProps = {
  servers: Server[]
  onSave: () => void | Promise<void>
  rule: RulesType | null
  setRule: (rule: RulesType | null) => void
}

export type FieldsProps = {
  rule: RulesType
  updateRule: (updates: Partial<RulesType>) => void
}

export type TestRule = {
  ruleId: string
  message: string
  title?: string
}
