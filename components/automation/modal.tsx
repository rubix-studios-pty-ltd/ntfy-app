'use client'

import { SquareArrowDown, SquareArrowUp } from 'lucide-react'
import { useRef } from 'react'
import { toast } from 'sonner'

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
import { stripRule } from '@/utils/stripRule'

interface ModalProps {
  rule: RulesType | null
  setRule: (rule: RulesType | null) => void
  onSave: () => void | Promise<void>
}

export function Modal({ rule, setRule, onSave }: ModalProps) {
  const open = Boolean(rule)
  const runAction = rule?.actionType === 'runProgram'
  const importInput = useRef<HTMLInputElement>(null)

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

    setRule({
      ...baseRule,
      actionType,
      actionValue: '',
    })
  }

  const exportRule = () => {
    if (!rule) {
      return
    }

    const exportData = {
      type: 'ntfy-app-rule',
      version: 1,
      exportedAt: new Date().toISOString(),
      rule: stripRule(rule),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${rule.name || 'automation-rule'}.json`
    link.click()

    URL.revokeObjectURL(url)

    toast.success('Rule exported.')
  }

  const importRule = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const importedRule = json?.type === 'ntfy-app-rule' ? json.rule : json

      if (!importedRule?.name || !importedRule?.topic || !importedRule?.matchType) {
        throw new Error('Invalid rule file')
      }

      setRule({
        ...rule,
        ...stripRule(importedRule),
        active: false,
      } as RulesType)
    } catch {
      toast.error('Invalid automation file.')
    } finally {
      if (importInput.current) {
        importInput.current.value = ''
      }
    }
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
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
                value={rule.name}
                onChange={(event) => updateRule({ name: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold">Topic</Label>
                <Input
                  className="border border-border"
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
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
                spellCheck={false}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="none"
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
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    value={rule.arguments ?? ''}
                    onChange={(event) => updateRule({ arguments: event.target.value })}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-semibold">Directory</Label>
                  <Input
                    className="border border-border"
                    spellCheck={false}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
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
                          spellCheck={false}
                          autoComplete="off"
                          autoCorrect="off"
                          autoCapitalize="none"
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
                        spellCheck={false}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="none"
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

          <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-2">
              <input
                ref={importInput}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]

                  if (file) {
                    void importRule(file)
                  }
                }}
              />

              <Button
                variant="outline"
                className="cursor-pointer transition-all duration-500"
                onClick={() => importInput.current?.click()}
              >
                <SquareArrowUp className="size-4" />
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer transition-all duration-500"
                onClick={exportRule}
              >
                <SquareArrowDown className="size-4" />
              </Button>
            </div>

            <div className="flex gap-2">
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
            </div>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  )
}
