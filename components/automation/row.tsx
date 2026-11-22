import { Pencil, Play, Trash } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { type RulesType } from '@/schema/automation'
import { actionType } from '@/utils/actionType'
import { formatDate } from '@/utils/formatDate'
import { formatAction } from '@/utils/getAction'
import { matchType } from '@/utils/matchType'
import { status, statusStyle } from '@/utils/status'

type Props = {
  rule: RulesType
  serverName: string
  onToggle: (ruleId: string) => Promise<void>
  onTest: (rule: RulesType) => Promise<void>
  onEdit: (rule: RulesType) => void
  onDelete: (rule: RulesType) => void
}

export function Row({ rule, serverName, onToggle, onTest, onEdit, onDelete }: Props) {
  return (
    <div className="grid grid-cols-[60px_0.8fr_minmax(0,1.2fr)_minmax(0,1.2fr)_100px_80px] gap-2 border-b border-border/40 p-3 last:border-b-0">
      <Switch
        aria-label={`Toggle ${rule.name}`}
        checked={rule.active}
        className="cursor-pointer border border-white/10 bg-card/5 data-[state=checked]:border-emerald-700 data-[state=checked]:bg-emerald-700 data-[state=unchecked]:border-foreground/50 data-[state=unchecked]:bg-accent/50 [&>span]:bg-foreground/50 data-[state=checked]:[&>span]:bg-emerald-600"
        onCheckedChange={() => void onToggle(rule.id)}
      />

      <span className="text-sm truncate">{rule.name}</span>

      <div className="flex flex-col gap-0.5 text-sm">
        <span>Server: {serverName}</span>
        <span>Topic: {rule.topic}</span>

        <div className="scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent h-6 overflow-hidden overflow-y-auto truncate">
          {rule.matchValue
            .split(/\r?\n/)
            .map((value) => value.trim())
            .filter((value) => value.length > 0)
            .map((value, index) => (
              <span className="block truncate" key={`${rule.id}-match-${index}`}>
                {matchType(rule.matchType)}: {value}
              </span>
            ))}
        </div>
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-semibold">{actionType(rule.actionType)}</span>
        <span className="block min-w-0 truncate">{formatAction(rule)}</span>
      </div>

      <div className="flex flex-col gap-0.5 text-sm">
        <span className={statusStyle(rule.status ?? 'never')}>
          {status(rule.status ?? 'never')}
        </span>
        <span className="text-muted-foreground text-xs">{formatDate(rule.lastRun)}</span>
      </div>

      <div className="flex justify-end gap-0.5">
        <Button
          aria-label={`Test ${rule.name}`}
          className="cursor-pointer text-muted-foreground transition-all duration-500"
          onClick={() => void onTest(rule)}
          size="icon-xs"
          variant="ghost"
        >
          <Play className="size-3.5" />
        </Button>

        <Button
          aria-label={`Edit ${rule.name}`}
          className="cursor-pointer text-muted-foreground transition-all duration-500"
          onClick={() => onEdit(rule)}
          size="icon-xs"
          variant="ghost"
        >
          <Pencil className="size-3.5" />
        </Button>

        <Button
          aria-label={`Delete ${rule.name}`}
          className="cursor-pointer text-muted-foreground transition-all duration-500"
          onClick={() => onDelete(rule)}
          size="icon-xs"
          variant="ghost"
        >
          <Trash className="size-3.5" />
        </Button>
      </div>
    </div>
  )
}
