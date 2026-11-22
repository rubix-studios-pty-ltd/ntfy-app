import { Row } from '@/components/automation/row'
import { ScrollArea } from '@/components/ui/scroll-area'
import { type RulesType } from '@/schema/automation'
import { type Server } from '@/types/ntfy'

type Props = {
  rules: RulesType[]
  servers: Server[]
  onToggle: (ruleId: string) => Promise<void>
  onTest: (rule: RulesType) => Promise<void>
  onEdit: (rule: RulesType) => void
  onDelete: (rule: RulesType) => void
}

export function Table({ rules, servers, onToggle, onTest, onEdit, onDelete }: Props) {
  return (
    <div className="border-border bg-card relative rounded-[9px] border shadow-xs">
      <div className="grid grid-cols-[60px_0.8fr_minmax(0,1.2fr)_minmax(0,1.2fr)_100px_80px] gap-2 border-b p-3 text-sm font-bold">
        <span>Active</span>
        <span>Name</span>
        <span>Trigger</span>
        <span>Action</span>
        <span>Status</span>
        <span aria-hidden="true" />
      </div>

      <ScrollArea
        className="h-[calc(100vh-186px)] overflow-hidden"
        onWheelCapture={(event) => event.stopPropagation()}
      >
        {rules.map((rule) => (
          <Row
            key={rule.id}
            onDelete={onDelete}
            onEdit={onEdit}
            onTest={onTest}
            onToggle={onToggle}
            rule={rule}
            serverName={servers.find((server) => server.id === rule.serverId)?.name ?? 'Unassigned'}
          />
        ))}

        {rules.length === 0 && (
          <div className="px-4 py-10 text-center text-sm">No automation rules found.</div>
        )}
      </ScrollArea>
    </div>
  )
}
