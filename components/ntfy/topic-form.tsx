'use client'

import { useId, useState } from 'react'

import { Modal } from '@/components/ntfy/modal'
import { type Icon, TopicIcon, topicIcons } from '@/components/ntfy/topic-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { subscribe, updateDisplay } from '@/lib/tauri/ntfy'
import { type Server, type Topic } from '@/types/ntfy'

type Props = {
  servers: Server[]
  editing?: Topic | null
  close: () => void
  saved: () => void
}

export function TopicForm({ servers, editing, close, saved }: Props) {
  const id = useId()
  const available = servers.filter((server) => server.enabled)

  const [serverId, setServerId] = useState(editing?.serverId ?? available[0]?.id ?? '')
  const [topic, setTopic] = useState(editing?.topic ?? '')
  const [displayName, setDisplayName] = useState(editing?.displayName ?? '')
  const [icon, setIcon] = useState<Icon>(editing?.icon ?? 'bell')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <Modal
      busy={busy}
      close={close}
      description={
        editing
          ? 'Change how this topic appears on this device.'
          : 'Subscribe to a topic and customise its appearance on this device.'
      }
      title={editing ? 'Edit topic' : 'Topic'}
    >
      <form
        className="mt-1.25 flex flex-col gap-4.5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (busy) return

          setBusy(true)
          setError('')

          try {
            if (editing) {
              await updateDisplay(editing.id, displayName.trim(), icon)
            } else {
              await subscribe(serverId, topic.trim(), displayName.trim(), icon)
            }

            saved()
            close()
          } catch (failure) {
            const message = String(failure)

            setError(
              message.includes('UNIQUE constraint failed: ntfy_topics.server_id, ntfy_topics.topic')
                ? 'You are already subscribed to this topic on this server.'
                : message
            )
          } finally {
            setBusy(false)
          }
        }}
      >
        <fieldset className="flex min-w-0 flex-col gap-3.75" disabled={busy}>
          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-server`}>
              Server
            </Label>

            <Select
              disabled={busy || !!editing || available.length === 0}
              onValueChange={setServerId}
              required
              value={serverId}
            >
              <SelectTrigger
                className="w-full cursor-pointer border-border bg-card text-xs text-foreground transition-all duration-500"
                id={`${id}-server`}
              >
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>

              <SelectContent position="popper">
                {servers
                  .filter((server) => editing?.serverId === server.id || server.enabled)
                  .map((server) => (
                    <SelectItem
                      className="cursor-pointer transition-all duration-500"
                      key={server.id}
                      value={server.id}
                    >
                      {server.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-topic`}>
              Topic
            </Label>

            <Input
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs text-foreground md:text-xs"
              id={`${id}-topic`}
              maxLength={64}
              minLength={1}
              onChange={(event) => setTopic(event.target.value)}
              pattern="[A-Za-z0-9_-]+"
              placeholder="server-alerts"
              readOnly={!!editing}
              required
              spellCheck={false}
              value={topic}
            />
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-display-name`}>
              Display
            </Label>

            <Input
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs text-foreground md:text-xs"
              id={`${id}-display-name`}
              maxLength={60}
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />

            <p className="text-[11px] text-muted-foreground">
              Leave blank to use the original topic name.
            </p>
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-icon`}>
              Icon
            </Label>

            <Select disabled={busy} onValueChange={(value) => setIcon(value as Icon)} value={icon}>
              <SelectTrigger
                className="w-full cursor-pointer transition-all duration-500 border-border bg-card text-xs text-foreground"
                id={`${id}-icon`}
              >
                <SelectValue placeholder="Select an icon" />
              </SelectTrigger>

              <SelectContent className="max-h-56" position="popper">
                {(Object.keys(topicIcons) as Icon[]).map((name) => (
                  <SelectItem
                    className="cursor-pointer transition-all duration-500"
                    key={name}
                    textValue={name.replaceAll('-', ' ')}
                    value={name}
                  >
                    <span className="flex items-center gap-2">
                      <TopicIcon aria-hidden="true" className="size-4 shrink-0" name={name} />
                      <span className="capitalize">{name.replaceAll('-', ' ')}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {!editing && (
            <p className="text-[11px] leading-[1.8] text-muted-foreground">
              Topic permissions are managed by your ntfy server. The display name and icon are
              stored locally.
            </p>
          )}
        </fieldset>

        {error && (
          <p
            className="rounded-md bg-danger-soft p-2.5 text-xs leading-[1.7] text-danger-foreground"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2 pt-1.75">
          <Button
            className="cursor-pointer transition-all duration-500"
            disabled={busy}
            onClick={close}
            size="sm"
            type="button"
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            className="cursor-pointer transition-all duration-500"
            disabled={busy || !serverId}
            size="sm"
            type="submit"
          >
            {busy ? 'Saving…' : editing ? 'Save' : 'Subscribe'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
