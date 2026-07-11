'use client'

import { useRef } from 'react'
import { SquareArrowDown, SquareArrowUp } from 'lucide-react'
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
  onSave: () => void | Promise<void>
  rule: RulesType | null
  setRule: (rule: RulesType | null) => void
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
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setRule(null)
        }
      }}
      open={open}
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
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="border border-border"
                onChange={(event) => updateRule({ name: event.target.value })}
                spellCheck={false}
                value={rule.name}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold">Topic</Label>
                <Input
                  autoCapitalize="none"
                  autoComplete="off"
                  autoCorrect="off"
                  className="border border-border"
                  onChange={(event) => updateRule({ topic: event.target.value })}
                  spellCheck={false}
                  value={rule.topic}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-semibold">Match</Label>
                <Select
                  onValueChange={(value) => updateRule({ matchType: value as MatchType })}
                  value={rule.matchType}
                >
                  <SelectTrigger className="w-full border border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    className="border bg-foreground text-primary-foreground"
                    position="popper"
                  >
                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="equals"
                    >
                      Equals
                    </SelectItem>
                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="contains"
                    >
                      Contains
                    </SelectItem>
                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="startsWith"
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
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="scrollbar h-24 resize-none overflow-y-auto border border-border"
                onChange={(event) => updateRule({ matchValue: event.target.value })}
                rows={4}
                spellCheck={false}
                value={rule.matchValue}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold">Action</Label>
                <Select
                  onValueChange={(value) => updateAction(value as ActionType)}
                  value={rule.actionType}
                >
                  <SelectTrigger className="w-full border border-border">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent
                    className="border bg-foreground text-primary-foreground"
                    position="popper"
                  >
                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="runProgram"
                    >
                      Run program
                    </SelectItem>

                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="openUrl"
                    >
                      Open URL
                    </SelectItem>

                    <SelectItem
                      className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                      value="module"
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
                    onValueChange={(value) =>
                      updateRule({
                        moduleId: value,
                        actionConfig: getDefault(value),
                      } as Partial<RulesType>)
                    }
                    value={rule.moduleId}
                  >
                    <SelectTrigger className="w-full border border-border">
                      <SelectValue placeholder="Select module" />
                    </SelectTrigger>

                    <SelectContent
                      className="border bg-foreground text-primary-foreground"
                      position="popper"
                    >
                      {moduleOptions.map((module) => (
                        <SelectItem
                          className="cursor-pointer focus:bg-primary focus:text-primary-foreground"
                          key={module.id}
                          value={module.id}
                        >
                          {module.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="border border-border"
                    onChange={(event) => updateRule({ actionValue: event.target.value })}
                    value={rule.actionValue}
                  />
                )}
              </div>
            </div>

            {runAction && (
              <>
                <div className="grid gap-2">
                  <Label className="font-semibold">Arguments</Label>
                  <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    className="border border-border"
                    onChange={(event) => updateRule({ arguments: event.target.value })}
                    spellCheck={false}
                    value={rule.arguments ?? ''}
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="font-semibold">Directory</Label>
                  <Input
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    className="border border-border"
                    onChange={(event) => updateRule({ workingDirectory: event.target.value })}
                    spellCheck={false}
                    value={rule.workingDirectory ?? ''}
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
                      <div className="grid grid-cols-3 gap-2" key={field.key}>
                        <Label className="font-semibold">{field.label}</Label>

                        <Input
                          autoCapitalize="none"
                          autoComplete="off"
                          autoCorrect="off"
                          className="border border-border col-span-2"
                          inputMode={field.type === 'number' ? 'numeric' : undefined}
                          max={field.allowVariables ? undefined : field.max}
                          min={field.allowVariables ? undefined : field.min}
                          onChange={(event) =>
                            updateRule({
                              actionConfig: {
                                ...(rule.actionConfig ?? {}),
                                [field.key]: parseConfig(field, event.target.value),
                              },
                            } as Partial<RulesType>)
                          }
                          placeholder={field.placeholder}
                          spellCheck={false}
                          type={
                            field.type === 'number' && !field.allowVariables ? 'number' : 'text'
                          }
                          value={getConfig(value)}
                        />
                      </div>
                    )
                  }

                  return (
                    <div className="grid gap-2" key={field.key}>
                      <Label className="font-semibold">{field.label}</Label>

                      <Input
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        className="border border-border"
                        onChange={(event) =>
                          updateRule({
                            actionConfig: {
                              ...(rule.actionConfig ?? {}),
                              [field.key]: event.target.value,
                            },
                          } as Partial<RulesType>)
                        }
                        placeholder={field.placeholder}
                        spellCheck={false}
                        value={typeof value === 'string' ? value : ''}
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
                accept="application/json,.json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0]

                  if (file) {
                    void importRule(file)
                  }
                }}
                ref={importInput}
                type="file"
              />

              <Button
                className="cursor-pointer transition-all duration-500"
                onClick={() => importInput.current?.click()}
                variant="outline"
              >
                <SquareArrowUp className="size-4" />
              </Button>

              <Button
                className="cursor-pointer transition-all duration-500"
                onClick={exportRule}
                variant="outline"
              >
                <SquareArrowDown className="size-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                className="cursor-pointer transition-all duration-500"
                onClick={() => setRule(null)}
                variant="outline"
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
