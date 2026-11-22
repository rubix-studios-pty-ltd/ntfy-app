import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { moduleMap } from '@/modules'
import { type RulesType } from '@/schema/automation'
import { type FieldsProps } from '@/types/automation'
import { getConfig, parseConfig } from '@/utils/getConfig'

export function Module({ rule, updateRule }: FieldsProps) {
  if (rule.actionType !== 'module') return null

  const module = moduleMap[rule.moduleId]

  if (!module?.fields?.length) return null

  const fields = module.fields

  return (
    <div className="grid gap-3 rounded-lg border border-border p-4">
      <div className="grid gap-2 pb-4">
        <Label className="font-semibold">Configurations</Label>

        {module.description && (
          <p className="text-[11px] text-muted-foreground">{module.description}</p>
        )}
      </div>

      {fields.map((field) => {
        const value = rule.actionConfig?.[field.key]

        if (field.type === 'number') {
          return (
            <div className="grid grid-cols-3 gap-2" key={field.key}>
              <Label className="font-semibold">{field.label}</Label>

              <Input
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground col-span-2"
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
                type={field.type === 'number' && !field.allowVariables ? 'number' : 'text'}
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
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
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
  )
}
