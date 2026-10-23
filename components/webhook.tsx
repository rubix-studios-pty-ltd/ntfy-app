'use client'

import { useEffect, useId, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

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
import { getSnapshot } from '@/lib/tauri/ntfy'
import { type Server } from '@/types/ntfy'
import { buildUrl } from '@/utils/buildUrl'

export function Webhook() {
  const id = useId()
  const [servers, setServers] = useState<Server[]>([])
  const [serverId, setServerId] = useState('')

  const instance = servers.find((server) => server.id === serverId)?.url ?? null

  const [token, setToken] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true

    void getSnapshot()
      .then((snapshot) => {
        if (!active) return

        setServers(snapshot.servers)
        setServerId(snapshot.servers[0]?.id ?? '')
      })
      .catch(() => {
        if (!active) return

        setServers([])
        setServerId('')
      })

    return () => {
      active = false
    }
  }, [])

  const handleInstanceChange = (value: string) => {
    setServerId(value)
    setToken('')
    setResult('')
    setCopied(false)
  }

  const handleBuildUrl = () => {
    const webhook = buildUrl({
      instance,
      topic,
      token,
    })

    if (!webhook.success) {
      setResult(webhook.error)
      return
    }

    setResult(webhook.url)
  }

  const handleClear = () => {
    setToken('')
    setTopic('')
    setResult('')
  }

  const handleCopy = async () => {
    if (!result) {
      return
    }

    try {
      await navigator.clipboard.writeText(result)

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="border-border bg-card relative rounded-[9px] border shadow-xs p-6 gap-4 flex flex-col">
      <div className="flex flex-col gap-2">
        <Label className="text-[11px]" htmlFor={`${id}-instance`}>
          Instance
        </Label>

        {servers.length > 1 ? (
          <Select onValueChange={handleInstanceChange} value={serverId}>
            <SelectTrigger
              className="w-full min-w-0 cursor-pointer border-border bg-card text-xs text-foreground"
              id={`${id}-instance`}
            >
              <SelectValue placeholder="Select an instance" />
            </SelectTrigger>

            <SelectContent position="popper">
              {servers.map((server) => (
                <SelectItem className="cursor-pointer" key={server.id} value={server.id}>
                  {server.name} · {server.url}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
            id={`${id}-instance`}
            placeholder="No instance configured"
            readOnly
            spellCheck={false}
            value={instance ?? ''}
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-[11px]">Topic</Label>

        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
          onChange={(e) => setTopic(e.target.value)}
          spellCheck={false}
          value={topic}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="text-[11px]">Token</Label>

        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="w-full min-w-0 rounded-md border border-border bg-card p-2.5 text-xs md:text-xs text-foreground"
          onChange={(e) => setToken(e.target.value)}
          spellCheck={false}
          type="password"
          value={token}
        />
      </div>

      <div className="flex gap-2">
        <Button
          className="flex-1 cursor-pointer bg-emerald-700 hover:bg-emerald-600 transition-all duration-500 text-primary-foreground font-semibold"
          onClick={handleBuildUrl}
        >
          Build
        </Button>

        <Button
          className="cursor-pointer transition-all duration-500"
          onClick={handleClear}
          variant="outline"
        >
          Clear
        </Button>
      </div>

      {result && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-end">
            <Button
              className="cursor-pointer text-muted-foreground transition-all duration-500"
              onClick={handleCopy}
              size="sm"
              variant="ghost"
            >
              {copied ? <CheckIcon className="size-3.5" /> : <CopyIcon className="size-3.5" />}
            </Button>
          </div>

          <Textarea
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            className="resize-none border border-border bg-background text-foreground"
            readOnly
            rows={2}
            spellCheck={false}
            value={result}
          />
        </div>
      )}
    </div>
  )
}
