import { type ExportRules } from '@/types/rules'

export const stripRule = (rule: ExportRules) => {
  const data = { ...rule } as Partial<ExportRules>

  delete data.id
  delete data.createdAt
  delete data.updatedAt
  delete data.lastRun
  delete data.status

  return data
}
