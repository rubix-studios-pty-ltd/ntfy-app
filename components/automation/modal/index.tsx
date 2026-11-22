'use client'

import { Action } from '@/components/automation/modal/action'
import { ModalFooter } from '@/components/automation/modal/footer'
import { Module } from '@/components/automation/modal/module'
import { Trigger } from '@/components/automation/modal/trigger'
import { Modal as SharedModal } from '@/components/ntfy/modal'
import { type ActionType, type RulesType } from '@/schema/automation'
import { type ModalProps } from '@/types/automation'
import { changeAction } from '@/utils/changeAction'

export function Modal({ rule, setRule, onSave, servers }: ModalProps) {
  if (!rule) return null

  const updateRule = (updates: Partial<RulesType>) => {
    setRule({ ...rule, ...updates } as RulesType)
  }

  const updateAction = (actionType: ActionType) => {
    setRule(changeAction(rule, actionType))
  }

  return (
    <SharedModal
      close={() => setRule(null)}
      description="Configure triggers and actions."
      title="Trigger"
    >
      <div className="grid gap-4">
        <Trigger rule={rule} servers={servers} updateRule={updateRule} />

        <Action rule={rule} updateAction={updateAction} updateRule={updateRule} />

        <Module rule={rule} updateRule={updateRule} />
      </div>

      <ModalFooter onSave={onSave} rule={rule} servers={servers} setRule={setRule} />
    </SharedModal>
  )
}
