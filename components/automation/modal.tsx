'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { getDefault, moduleMap, moduleOptions } from '@/modules'
import { type ActionType, type MatchType, type RulesType } from '@/schema/automation'
import { actionLabels } from '@/utils/actionType'
import { getBase } from '@/utils/getBase'
import { getConfig, parseConfig } from '@/utils/getConfig'

interface ModalProps {
  rule: RulesType | null
  setRule: (rule: RulesType | null) => void
  onSave: () => void | Promise<void>
}

export function Modal({ rule, setRule, onSave }: ModalProps) {
  const open = Boolean(rule)
  const runAction = rule?.actionType === 'runProgram' || rule?.actionType === 'runScript'

  const updateRule = (updates: Partial<RulesType>) => {
    if (!rule) {
      return
    }

    setRule({
      ...rule,
      ...updates,
    } as RulesType)
  }

  const updateAction = (actionType: ActionType) => {
    if (!rule) {
      return
    }

    const baseRule = getBase(rule)

    if (actionType === 'module') {
      setRule({
        ...baseRule,
        actionType,
        moduleId: '',
        actionConfig: {},
      })

      return
    }

    if (actionType === 'runProgram') {
      setRule({
        ...baseRule,
        actionType,
        actionValue: '',
        arguments: undefined,
        workingDirectory: undefined,
      })

      return
    }

    if (actionType === 'runScript') {
      setRule({
        ...baseRule,
        actionType,
        actionValue: '',
        arguments: undefined,
        workingDirectory: undefined,
      })

      return
    }

    setRule({
      ...baseRule,
      actionType,
      actionValue: '',
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setRule(null)
        }
      }}
    >
      {rule && (
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Rule</DialogTitle>
            <DialogDescription className="sr-only">
              Configure triggers and actions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="font-semibold">Name</Label>
              <Input
                className="border border-border"
                value={rule.name}
                onChange={(event) => updateRule({ name: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold">Topic</Label>
                <Input
                  className="border border-border"
                  value={rule.topic}
                  onChange={(event) => updateRule({ topic: event.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-semibold">Match</Label>
                <Select
                  value={rule.matchType}
                  onValueChange={(value) => updateRule({ matchType: value as MatchType })}
                >
                  <SelectTrigger className="w-full border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="border bg-foreground text-primary-foreground"
                  >
                    <SelectItem
                      value="equals"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Equals
                    </SelectItem>
                    <SelectItem
                      value="contains"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Contains
                    </SelectItem>
                    <SelectItem
                      value="startsWith"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Starts with
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-semibold">Value</Label>
              <Textarea
                className="scrollbar h-24 resize-none overflow-y-auto border border-border"
                rows={4}
                value={rule.matchValue}
                onChange={(event) => updateRule({ matchValue: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold">Action</Label>
                <Select
                  value={rule.actionType}
                  onValueChange={(value) => updateAction(value as ActionType)}
                >
                  <SelectTrigger className="w-full border border-border">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    className="border bg-foreground text-primary-foreground"
                  >
                    <SelectItem
                      value="runProgram"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Run program
                    </SelectItem>

                    <SelectItem
                      value="runScript"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Run script
                    </SelectItem>

                    <SelectItem
                      value="openUrl"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Open URL
                    </SelectItem>

                    <SelectItem
                      value="module"
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                    >
                      Module
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="font-semibold">{actionLabels[rule.actionType]}</Label>

                {rule.actionType === 'module' ? (
                  <Select
                    value={rule.moduleId}
                    onValueChange={(value) =>
                      updateRule({
                        moduleId: value,
                        actionConfig: getDefault(value),
                      } as Partial<RulesType>)
                    }
                  >
                    <SelectTrigger className="w-full border border-border">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>

                    <SelectContent
                      position="popper"
                      className="border bg-foreground text-primary-foreground"
                    >
                      {moduleOptions.map((module) => (
                        <SelectItem
                          key={module.id}
                          value={module.id}
                          className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                        >
                          {module.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="border border-border"
                    value={rule.actionValue}
                    onChange={(event) => updateRule({ actionValue: event.target.value })}
                  />
                )}
              </div>
            </div>

            {runAction && (
              <>
                <div className="grid gap-2">
                  <Label className="font-semibold">Arguments</Label>
                  <Input
                    className="border border-border"
                    value={rule.arguments ?? ''}
                    onChange={(event) => updateRule({ arguments: event.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-semibold">Directory</Label>
                  <Input
                    className="border border-border"
                    value={rule.workingDirectory ?? ''}
                    onChange={(event) => updateRule({ workingDirectory: event.target.value })}
                  />
                </div>
              </>
            )}

            {rule.actionType === 'module' && moduleMap[rule.moduleId]?.fields?.length ? (
              <div className="grid gap-3 rounded-lg border border-border p-3">
                <div className="grid gap-2">
                  <Label className="font-semibold">Configurations</Label>

                  {moduleMap[rule.moduleId]?.description && (
                    <p className="text-xs text-muted-foreground">
                      {moduleMap[rule.moduleId].description}
                    </p>
                  )}
                </div>

                {moduleMap[rule.moduleId].fields?.map((field) => {
                  const value = rule.actionConfig?.[field.key]

                  if (field.type === 'number') {
                    return (
                      <div key={field.key} className="grid grid-cols-3 gap-2">
                        <Label className="font-semibold">{field.label}</Label>

                        <Input
                          type={
                            field.type === 'number' && !field.allowVariables ? 'number' : 'text'
                          }
                          inputMode={field.type === 'number' ? 'numeric' : undefined}
                          min={field.allowVariables ? undefined : field.min}
                          max={field.allowVariables ? undefined : field.max}
                          placeholder={field.placeholder}
                          className="border border-border col-span-2"
                          value={getConfig(value)}
                          onChange={(event) =>
                            updateRule({
                              actionConfig: {
                                ...(rule.actionConfig ?? {}),
                                [field.key]: parseConfig(field, event.target.value),
                              },
                            } as Partial<RulesType>)
                          }
                        />
                      </div>
                    )
                  }

                  return (
                    <div key={field.key} className="grid gap-2">
                      <Label className="font-semibold">{field.label}</Label>

                      <Input
                        placeholder={field.placeholder}
                        className="border border-border"
                        value={typeof value === 'string' ? value : ''}
                        onChange={(event) =>
                          updateRule({
                            actionConfig: {
                              ...(rule.actionConfig ?? {}),
                              [field.key]: event.target.value,
                            },
                          } as Partial<RulesType>)
                        }
                      />
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="cursor-pointer transition-all duration-500"
              onClick={() => setRule(null)}
            >
              Cancel
            </Button>

            <Button
              className="cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500"
              onClick={onSave}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
