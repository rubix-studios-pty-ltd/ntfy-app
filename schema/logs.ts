import { z } from 'zod'

import { actionTypeSchema, statusSchema } from '@/schema/automation'

export const logSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  ruleName: z.string(),
  topic: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  actionType: actionTypeSchema,
  actionValue: z.string().optional().nullable(),
  moduleId: z.string().optional().nullable(),
  status: statusSchema.exclude(['never']),
  error: z.string().optional().nullable(),
  createdAt: z.string(),
})

export type LogsType = z.infer<typeof logSchema>
