import { invoke } from '@tauri-apps/api/core'

import { type Rules } from '@/types/automation'

export function listRules() {
  return invoke<Rules[]>('list_rules')
}

export function createRule(rule: Rules) {
  return invoke<Rules>('create_rule', { rule })
}

export function updateRule(rule: Rules) {
  return invoke<Rules>('update_rule', { rule })
}

export function deleteRule(ruleId: string) {
  return invoke('delete_rule', { ruleId })
}

export function toggleRule(ruleId: string) {
  return invoke<Rules>('toggle_rule', { ruleId })
}

export function testRule(ruleId: string) {
  return invoke<Rules>('test_rule', { ruleId })
}

export function ruleLogs(ruleId: string) {
  return invoke('rule_logs', { ruleId })
}
