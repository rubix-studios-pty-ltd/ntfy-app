import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getDefault, moduleOptions } from '@/modules'
import { type ActionType, type RulesType } from '@/schema/automation'
import { type FieldsProps } from '@/types/automation'
import { actionLabels } from '@/utils/actionType'

type Props = FieldsProps & {
  updateAction: (actionType: ActionType) => void
}

export function Action({ rule, updateRule, updateAction }: Props) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="font-semibold">Action</Label>
          <Select
            onValueChange={(value) => updateAction(value as ActionType)}
            value={rule.actionType}
          >
            <SelectTrigger className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground">
              <SelectValue />
            </SelectTrigger>

            <SelectContent position="popper">
              <SelectItem className="cursor-pointer duration-500 transition-all" value="runProgram">
                Run program
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="openUrl">
                Open URL
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="module">
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
              <SelectTrigger className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>

              <SelectContent position="popper">
                {moduleOptions.map((module) => (
                  <SelectItem
                    className="cursor-pointer duration-500 transition-all"
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
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              onChange={(event) => updateRule({ actionValue: event.target.value })}
              value={rule.actionValue}
            />
          )}
        </div>
      </div>

      {rule.actionType === 'runProgram' && (
        <>
          <div className="grid gap-2">
            <Label className="font-semibold">Arguments</Label>
            <Input
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
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
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              onChange={(event) => updateRule({ workingDirectory: event.target.value })}
              spellCheck={false}
              value={rule.workingDirectory ?? ''}
            />
          </div>
        </>
      )}
    </>
  )
}
