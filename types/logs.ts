import { type LogsType } from '@/schema/logs'

export type LogsInput = {
  page?: number
  pageSize?: number
  ruleId?: string
}

export type LogsList = {
  items: LogsType[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
