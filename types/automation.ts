import { z } from 'zod'

export const actionTypeSchema = z.enum(['runProgram', 'runScript', 'openUrl', 'module'])

export const matchTypeSchema = z.enum(['equals', 'contains', 'startsWith'])

export const moduleIdSchema = z.string().trim().min(1, 'Module is required')

export const statusSchema = z.enum(['success', 'failed', 'never'])

const optionalText = z
  .string()
  .trim()
  .transform((value) => value || undefined)
  .optional()

const baseSchema = z.object({
  id: z.string().min(1),
  active: z.boolean(),

  name: z.string().trim().min(1, 'Name is required'),
  topic: z.string().trim().min(1, 'Topic is required'),

  matchType: matchTypeSchema,
  matchValue: z.string().trim().min(1, 'Match is required'),

  lastRun: optionalText,
  status: statusSchema.optional(),
})

const programSchema = baseSchema.extend({
  actionType: z.literal('runProgram'),
  actionValue: z.string().trim().min(1, 'Program is required'),
  arguments: optionalText,
  workingDirectory: optionalText,
})

const scriptSchema = baseSchema.extend({
  actionType: z.literal('runScript'),
  actionValue: z.string().trim().min(1, 'Script is required'),
  arguments: optionalText,
  workingDirectory: optionalText,
})

const urlSchema = baseSchema.extend({
  actionType: z.literal('openUrl'),
  actionValue: z.url('URL is required'),
})

const moduleSchema = baseSchema.extend({
  actionType: z.literal('module'),
  moduleId: z.string().trim().min(1, 'Module is required'),
  actionConfig: z.record(z.string(), z.unknown()).optional(),
})

export const ruleSchema = z.discriminatedUnion('actionType', [
  programSchema,
  scriptSchema,
  urlSchema,
  moduleSchema,
])

export const logSchema = z.object({
  id: z.string(),
  ruleId: z.string(),
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

export type ActionType = z.infer<typeof actionTypeSchema>
export type LogsType = z.infer<typeof logSchema>
export type MatchType = z.infer<typeof matchTypeSchema>
export type ModuleId = z.infer<typeof moduleIdSchema>
export type RulesType = z.infer<typeof ruleSchema>
export type StatusType = z.infer<typeof statusSchema>
