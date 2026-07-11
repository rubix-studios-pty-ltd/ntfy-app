'use client'

import { useEffect, useState } from 'react'
import { CheckIcon, CopyIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readUrl } from '@/lib/tauri/settings'
import { useStore } from '@/store/instance'
import { buildUrl } from '@/utils/buildUrl'

export function Webhook() {
  const instance = useStore((state) => state.instance)
  const setInstance = useStore((state) => state.setInstance)

  const [token, setToken] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void (async () => {
      const url = await readUrl()

      setInstance(url)
    })()
  }, [setInstance])

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
    <>
      <div className="flex flex-col gap-2">
        <Label className="font-bold">Instance</Label>

        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="border border-border"
          placeholder="No instance configured"
          readOnly
          spellCheck={false}
          value={instance ?? ''}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-bold">Topic</Label>

        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="border border-border"
          onChange={(e) => setTopic(e.target.value)}
          spellCheck={false}
          value={topic}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label className="font-bold">Token</Label>

        <Input
          autoCapitalize="none"
          autoComplete="off"
          autoCorrect="off"
          className="border border-border"
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
          Build URL
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
          <div className="flex items-center justify-between">
            <Label className="font-bold">Webhook</Label>

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
    </>
  )
}
