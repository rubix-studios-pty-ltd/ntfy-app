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
import { type MatchType } from '@/schema/automation'
import { type FieldsProps } from '@/types/automation'
import { type Server } from '@/types/ntfy'

type Props = FieldsProps & {
  servers: Server[]
}

export function Trigger({ rule, servers, updateRule }: Props) {
  return (
    <>
      <div className="grid gap-2">
        <Label className="text-[11px]">Name</Label>
        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
          onChange={(event) => updateRule({ name: event.target.value })}
          spellCheck={false}
          value={rule.name}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label className="text-[11px]">Server</Label>
          <Select onValueChange={(value) => updateRule({ serverId: value })} value={rule.serverId}>
            <SelectTrigger className="w-full border-border bg-card text-xs">
              <SelectValue placeholder="Select server" />
            </SelectTrigger>

            <SelectContent position="popper">
              {servers.map((server) => (
                <SelectItem key={server.id} value={server.id}>
                  {server.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <Label className="text-[11px]">Topic</Label>
          <Input
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
            onChange={(event) => updateRule({ topic: event.target.value })}
            spellCheck={false}
            value={rule.topic}
          />
        </div>

        <div className="grid gap-2">
          <Label className="text-[11px]">Match</Label>
          <Select
            onValueChange={(value) => updateRule({ matchType: value as MatchType })}
            value={rule.matchType}
          >
            <SelectTrigger className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground">
              <SelectValue />
            </SelectTrigger>

            <SelectContent position="popper">
              <SelectItem className="cursor-pointer duration-500 transition-all" value="equals">
                Equals
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="contains">
                Contains
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="startsWith">
                Starts with
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="regex">
                Regex
              </SelectItem>

              <SelectItem className="cursor-pointer duration-500 transition-all" value="priority">
                Priority
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2">
        <Label className="font-semibold">Value</Label>
        {rule.matchType === 'priority' ? (
          <Input
            autoComplete="off"
            className="w-full border-border bg-card text-xs"
            onChange={(event) => updateRule({ matchValue: event.target.value })}
            value={rule.matchValue}
          />
        ) : (
          <Textarea
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="scrollbar-thin scrollbar-thumb-muted-foreground scrollbar-track-transparent h-24 resize-none overflow-y-auto border border-border"
            onChange={(event) => updateRule({ matchValue: event.target.value })}
            placeholder={rule.matchType === 'regex' ? 'e.g. Error\\s+(\\d+)' : undefined}
            rows={4}
            spellCheck={false}
            value={rule.matchValue}
          />
        )}

        {rule.matchType === 'regex' && (
          <p className="text-[11px] text-muted-foreground">
            One pattern per line. The first capture group becomes $value.
          </p>
        )}

        {rule.matchType === 'priority' && (
          <p className="text-[11px] text-muted-foreground">
            Supports comparisons such as &gt;=4 and comma-separated.
          </p>
        )}
      </div>
    </>
  )
}
