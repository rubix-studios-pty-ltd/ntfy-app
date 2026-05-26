import { z } from 'zod'

export const matchTypeSchema = z.enum(['equals', 'contains', 'startsWith'])

export const actionTypeSchema = z.enum(['runProgram', 'runScript', 'openUrl'])

export const statusSchema = z.enum(['success', 'failed', 'never'])

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

export const ruleSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),

  name: z.string().trim().min(1, 'Rule name is required'),
  topic: z.string().trim().min(1, 'Topic is required'),

  matchType: matchTypeSchema,
  matchValue: z.string().trim().min(1, 'Match value is required'),

  actionType: actionTypeSchema,
  actionValue: z.string().trim().min(1, 'Action value is required'),

  arguments: optionalText,
  workingDirectory: optionalText,

  lastRun: optionalText,
  status: statusSchema.optional(),
})

export type MatchType = z.infer<typeof matchTypeSchema>
export type ActionType = z.infer<typeof actionTypeSchema>
export type StatusType = z.infer<typeof statusSchema>
export type Rules = z.infer<typeof ruleSchema>
