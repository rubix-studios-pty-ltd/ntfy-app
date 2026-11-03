'use client'

import { useId, useState } from 'react'

import { Modal } from '@/components/ntfy/modal'
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
import { subscribe } from '@/lib/tauri/ntfy'
import { type Server } from '@/types/ntfy'

type Props = {
  servers: Server[]
  close: () => void
  saved: () => void
}

export function TopicForm({ servers, close, saved }: Props) {
  const id = useId()
  const available = servers.filter((server) => server.enabled)

  const [serverId, setServerId] = useState(available[0]?.id ?? '')
  const [topic, setTopic] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <Modal
      busy={busy}
      close={close}
      description="Subscribe to a topic to start listening to events."
      title="Topic"
    >
      <form
        className="mt-1.25 flex flex-col gap-4.5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (busy) return

          setBusy(true)
          setError('')

          try {
            await subscribe(serverId, topic)
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
              disabled={busy || available.length === 0}
              onValueChange={setServerId}
              required
              value={serverId}
            >
              <SelectTrigger
                className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground"
                id={`${id}-server`}
              >
                <SelectValue placeholder="Select a server" />
              </SelectTrigger>

              <SelectContent position="popper">
                {available.map((server) => (
                  <SelectItem
                    className="cursor-pointer duration-500 transition-all"
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
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              id={`${id}-topic`}
              maxLength={64}
              minLength={1}
              onChange={(event) => setTopic(event.target.value)}
              pattern="[A-Za-z0-9_-]+"
              placeholder="server-alerts"
              required
              spellCheck={false}
              value={topic}
            />
          </div>

          <p className="text-[11px] leading-[1.8] text-muted-foreground">
            Use an existing topic name or choose a new one. Topic permissions are managed by your
            ntfy server.
          </p>
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
            className="cursor-pointer duration-500 transition-all"
            disabled={busy}
            onClick={close}
            size="sm"
            type="button"
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            className="cursor-pointer duration-500 transition-all"
            disabled={busy || !serverId}
            size="sm"
            type="submit"
          >
            {busy ? 'Subscribing…' : 'Subscribe'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
