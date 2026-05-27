import { z } from 'zod'

export const matchTypeSchema = z.enum(['equals', 'contains', 'startsWith'])

export const actionTypeSchema = z.enum(['runProgram', 'runScript', 'openUrl'])

export const statusSchema = z.enum(['success', 'failed', 'never'])

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

export const logSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
  topic: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  message: z.string().optional().nullable(),
  actionType: actionTypeSchema,
  actionValue: z.string(),
  status: statusSchema.exclude(['never']),
  error: z.string().optional().nullable(),
  createdAt: z.string(),
})

export const ruleSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),

  name: z.string().trim().min(1, 'Name is required'),
  topic: z.string().trim().min(1, 'Topic is required'),

  matchType: matchTypeSchema,
  matchValue: z.string().trim().min(1, 'Match is required'),

  actionType: actionTypeSchema,
  actionValue: z.string().trim().min(1, 'Action is required'),

  arguments: optionalText,
  workingDirectory: optionalText,

  lastRun: optionalText,
  status: statusSchema.optional(),
})

export type ActionType = z.infer<typeof actionTypeSchema>
export type LogsType = z.infer<typeof logSchema>
export type MatchType = z.infer<typeof matchTypeSchema>
export type RulesType = z.infer<typeof ruleSchema>
export type StatusType = z.infer<typeof statusSchema>
