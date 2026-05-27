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
import { type ActionType, type MatchType, type Rules } from '@/types/automation'
import { actionLabels } from '@/utils/actionType'

interface ModalProps {
  rule: Rules | null
  setRule: (rule: Rules | null) => void
  onSave: () => void | Promise<void>
}

export function Modal({ rule, setRule, onSave }: ModalProps) {
  const open = Boolean(rule)

  const updateRule = (updates: Partial<Rules>) => {
    if (!rule) {
      return
    }

    setRule({
      ...rule,
      ...updates,
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto border-white/10 bg-zinc-950 text-slate-50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="sr-only">Rule</DialogTitle>
            <DialogDescription className="sr-only">
              Configure triggers and actions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label className="font-semibold text-slate-200">Name</Label>
              <Input
                className="border border-white/10 bg-white/5 text-slate-50"
                value={rule.name}
                onChange={(event) => updateRule({ name: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold text-slate-200">Topic</Label>
                <Input
                  className="border border-white/10 bg-white/5 text-slate-50"
                  value={rule.topic}
                  onChange={(event) => updateRule({ topic: event.target.value })}
                />
              </div>

              <div className="grid gap-2">
                <Label className="font-semibold text-slate-200">Match</Label>
                <Select
                  value={rule.matchType}
                  onValueChange={(value) => updateRule({ matchType: value as MatchType })}
                >
                  <SelectTrigger className="w-full border border-white/10 bg-white/5 text-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    position="popper"
                    className="border border-white/10 bg-zinc-950 text-slate-50"
                  >
                    <SelectItem
                      value="equals"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Equals
                    </SelectItem>
                    <SelectItem
                      value="contains"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Contains
                    </SelectItem>
                    <SelectItem
                      value="startsWith"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Starts with
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-semibold text-slate-200">Value</Label>
              <Textarea
                className="resize-none border border-white/10 bg-white/5 text-slate-50"
                rows={3}
                value={rule.matchValue}
                onChange={(event) => updateRule({ matchValue: event.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="font-semibold text-slate-200">Action</Label>
                <Select
                  value={rule.actionType}
                  onValueChange={(value) =>
                    updateRule({
                      actionType: value as ActionType,
                    })
                  }
                >
                  <SelectTrigger className="w-full border border-white/10 bg-white/5 text-slate-50">
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent
                    position="popper"
                    className="border border-white/10 bg-zinc-950 text-slate-50"
                  >
                    <SelectItem
                      value="runProgram"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Run program
                    </SelectItem>

                    <SelectItem
                      value="runScript"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Run script
                    </SelectItem>

                    <SelectItem
                      value="openUrl"
                      className="cursor-pointer focus:bg-white/10 focus:text-slate-50"
                    >
                      Open URL
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="font-semibold text-slate-200">
                  {actionLabels[rule.actionType]}
                </Label>
                <Input
                  className="border border-white/10 bg-white/5 text-slate-50"
                  value={rule.actionValue}
                  onChange={(event) => updateRule({ actionValue: event.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="font-semibold text-slate-200">Arguments</Label>
              <Input
                className="border border-white/10 bg-white/5 text-slate-50"
                value={rule.arguments}
                onChange={(event) => updateRule({ arguments: event.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label className="font-semibold  text-slate-200">Directory</Label>
              <Input
                className="border border-white/10 bg-white/5 text-slate-50"
                value={rule.workingDirectory}
                onChange={(event) => updateRule({ workingDirectory: event.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              className="cursor-pointer rounded-lg bg-linear-to-br from-zinc-800 to-zinc-900 font-semibold text-slate-50"
              onClick={() => setRule(null)}
            >
              Cancel
            </Button>

            <Button
              className="cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 font-semibold text-slate-50"
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
