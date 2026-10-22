'use client'

import { type SyntheticEvent, useId, useState } from 'react'
import { Trash2 } from 'lucide-react'

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
import { saveServer } from '@/lib/tauri/ntfy'
import { type AuthKind, type Server } from '@/types/ntfy'

type Props = {
  server?: Server
  close: () => void
  saved: () => void
  remove?: () => void
}

export function ServerForm({ server, close, saved, remove }: Props) {
  const id = useId()

  const [name, setName] = useState(server?.name ?? '')
  const [url, setUrl] = useState(server?.url ?? 'https://ntfy.sh')
  const [kind, setKind] = useState<AuthKind>(server?.authKind ?? 'basic')
  const [username, setUsername] = useState(server?.username ?? '')
  const [secret, setSecret] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const retained = Boolean(
    server?.enabled && kind === server.authKind && username === server.username
  )

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (busy) return

    setBusy(true)
    setError('')

    try {
      await saveServer({
        id: server?.id ?? null,
        name,
        url,
        authKind: kind,
        username: kind === 'basic' ? username : '',
        secret: kind === 'none' ? '' : secret || (retained ? null : ''),
      })

      setSecret('')
      saved()
      close()
    } catch (failure) {
      setError(String(failure))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      busy={busy}
      close={close}
      description="Your connection is locally stored and restored on restart."
      title={server ? 'Edit' : 'Connect'}
    >
      <form className="mt-1.25 flex flex-col gap-4.5" onSubmit={submit}>
        <fieldset className="flex min-w-0 flex-col gap-3.75" disabled={busy}>
          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-name`}>
              Display name
            </Label>

            <Input
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              id={`${id}-name`}
              maxLength={100}
              onChange={(event) => setName(event.target.value)}
              placeholder="My notifications"
              required
              value={name}
            />
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-url`}>
              Server URL
            </Label>

            <Input
              className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
              id={`${id}-url`}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://ntfy.example.com"
              readOnly={Boolean(server)}
              required
              spellCheck={false}
              type="url"
              value={url}
            />
          </div>

          <div className="flex flex-col gap-1.75">
            <Label className="text-[11px]" htmlFor={`${id}-auth`}>
              Authentication
            </Label>

            <Select
              disabled={busy}
              onValueChange={(value) => {
                if (value === 'basic' || value === 'token' || value === 'none') {
                  setKind(value)
                  setSecret('')
                }
              }}
              value={kind}
            >
              <SelectTrigger
                className="cursor-pointer duration-500 transition-all w-full border-border bg-card text-xs text-foreground"
                id={`${id}-auth`}
              >
                <SelectValue placeholder="Select authentication" />
              </SelectTrigger>

              <SelectContent position="popper">
                <SelectItem className="cursor-pointer duration-500 transition-all" value="basic">
                  Username and password
                </SelectItem>
                <SelectItem className="cursor-pointer duration-500 transition-all" value="token">
                  Access token
                </SelectItem>
                <SelectItem className="cursor-pointer duration-500 transition-all" value="none">
                  Anonymous
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {kind === 'basic' && (
            <div className="flex flex-col gap-1.75">
              <Label className="text-[11px]" htmlFor={`${id}-username`}>
                Username
              </Label>

              <Input
                autoComplete="username"
                className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
                id={`${id}-username`}
                onChange={(event) => setUsername(event.target.value)}
                required
                spellCheck={false}
                value={username}
              />
            </div>
          )}

          {kind !== 'none' && (
            <div className="flex flex-col gap-1.75">
              <Label className="text-[11px]" htmlFor={`${id}-secret`}>
                {kind === 'basic' ? 'Password' : 'Access token'}
              </Label>

              <Input
                autoComplete={kind === 'basic' ? 'current-password' : 'off'}
                className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
                id={`${id}-secret`}
                onChange={(event) => setSecret(event.target.value)}
                placeholder={retained ? 'Leave blank to keep saved credentials' : ''}
                required={!retained}
                type="password"
                value={secret}
              />
            </div>
          )}

          {kind === 'none' && (
            <p className="text-[11px] leading-[1.8] text-muted-foreground">
              Anonymous access follows the server’s topic permissions. Public topics can be read by
              other users.
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

        {server && remove && (
          <Button
            className="cursor-pointer duration-500 transition-all mt-0.75 h-auto justify-start gap-1.75 p-0 has-[>svg]:px-0 text-[11px] text-danger-foreground"
            disabled={busy}
            onClick={remove}
            type="button"
            variant="link"
          >
            <Trash2 className="size-3.5" />
            Remove
          </Button>
        )}

        <div className="flex justify-end gap-2 pt-1.75">
          <Button
            className="cursor-pointer duration-500 transition-all"
            disabled={busy}
            onClick={close}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            className="cursor-pointer duration-500 transition-all"
            disabled={busy}
            size="sm"
            type="submit"
          >
            {busy ? 'Connecting…' : 'Save'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
