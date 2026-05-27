import { invoke } from '@tauri-apps/api/core'

import { type LogsType, type RulesType } from '@/types/automation'

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

export function ruleLogs(ruleId: string) {
  return invoke<LogsType[]>('rule_logs', { ruleId })
}
