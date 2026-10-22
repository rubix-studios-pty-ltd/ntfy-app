'use client'

import { useId, useState } from 'react'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'
import { publish } from '@/lib/tauri/ntfy'
import { type Server, type Topic } from '@/types/ntfy'

type Props = {
  topics: Topic[]
  servers: Server[]
  selected: string | null
  close: () => void
}

export function PublishForm({ topics, servers, selected, close }: Props) {
  const id = useId()

  const [topicId, setTopicId] = useState(selected ?? topics[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState(3)
  const [tags, setTags] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <Modal busy={busy} close={close} description="Send a message to a topic." title="Publish">
      <form
        className="mt-1.25 flex flex-col gap-4.5"
        onSubmit={async (event) => {
          event.preventDefault()
          if (busy) return

          setBusy(true)
          setError('')

          try {
            await publish({
              topicId,
              title,
              message,
              priority,
              tags: tags
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean),
            })

            toast.success('Published')
            close()
          } catch (failure) {
            setError(String(failure))
          } finally {
            setBusy(false)
          }
        }}
      >
        <fieldset className="flex min-w-0 flex-col gap-3.75" disabled={busy}>
          <div className="flex min-w-0 flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-topic`}>
              Topic
            </Label>

            <Select disabled={busy} onValueChange={setTopicId} required value={topicId}>
              <SelectTrigger
                className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground"
                id={`${id}-topic`}
              >
                <SelectValue placeholder="Select a topic" />
              </SelectTrigger>

              <SelectContent position="popper">
                {topics.map((topic) => (
                  <SelectItem
                    className="cursor-pointer duration-500 transition-all"
                    key={topic.id}
                    value={topic.id}
                  >
                    {servers.find((server) => server.id === topic.serverId)?.name} / {topic.topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-title`}>
              Title
            </Label>

            <Input
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              id={`${id}-title`}
              maxLength={256}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional title"
              value={title}
            />
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-message`}>
              Message
            </Label>

            <Textarea
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground resize-none"
              id={`${id}-message`}
              maxLength={4096}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Write your notification…"
              required
              rows={3}
              value={message}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex min-w-0 flex-col gap-1.75">
              <Label className="text-[11px]" htmlFor={`${id}-priority`}>
                Priority
              </Label>

              <Select
                disabled={busy}
                onValueChange={(value) => setPriority(Number(value))}
                value={String(priority)}
              >
                <SelectTrigger
                  className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground"
                  id={`${id}-priority`}
                >
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>

                <SelectContent position="popper">
                  <SelectItem className="cursor-pointer duration-500 transition-all" value="1">
                    Minimum
                  </SelectItem>
                  <SelectItem className="cursor-pointer duration-500 transition-all" value="2">
                    Low
                  </SelectItem>
                  <SelectItem className="cursor-pointer duration-500 transition-all" value="3">
                    Default
                  </SelectItem>
                  <SelectItem className="cursor-pointer duration-500 transition-all" value="4">
                    High
                  </SelectItem>
                  <SelectItem className="cursor-pointer duration-500 transition-all" value="5">
                    Urgent
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex min-w-0 flex-col gap-1.75">
              <Label className="text-[11px]" htmlFor={`${id}-tags`}>
                Tags
              </Label>

              <Input
                className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
                id={`${id}-tags`}
                onChange={(event) => setTags(event.target.value)}
                placeholder="warning, backup"
                value={tags}
              />
            </div>
          </div>
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
            disabled={busy || !topicId}
            size="sm"
            type="submit"
          >
            {busy ? 'Publishing…' : 'Publish'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
