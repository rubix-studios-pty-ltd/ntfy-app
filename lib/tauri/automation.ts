import { invoke } from '@tauri-apps/api/core'

import { type RulesType } from '@/schema/automation'
import { type LogsInput, type LogsList } from '@/types/logs'

export function listRules() {
  return invoke<RulesType[]>('list_rules')
}

export function createRule(rule: RulesType) {
  return invoke<RulesType>('create_rule', { rule })
}

export function updateRule(rule: RulesType) {
  return invoke<RulesType>('update_rule', { rule })
}

export function deleteRule(ruleId: string) {
  return invoke('delete_rule', { ruleId })
}

export function toggleRule(ruleId: string) {
  return invoke<RulesType>('toggle_rule', { ruleId })
}

export function testRule(ruleId: string) {
  return invoke<RulesType>('test_rule', { ruleId })
}

export function listLogs(input: LogsInput = {}) {
  return invoke<LogsList>('list_logs', { input })
}
