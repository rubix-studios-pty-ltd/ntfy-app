'use client'

import { CheckIcon, CopyIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { readUrl } from '@/utils/readUrl'

export function Webhook() {
  const [instance, setInstance] = useState<string | null>(null)
  const [token, setToken] = useState('')
  const [topic, setTopic] = useState('')
  const [result, setResult] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void (async () => {
      const url = await readUrl()

      setInstance(url)
    })()
  }, [])

  function buildUrl() {
    if (!instance) {
      setResult('Missing instance URL')
      return
    }

    if (!topic) {
      setResult('Please enter a topic')
      return
    }

    const cleanUrl = instance.replace(/\/+$/, '')
    let url = `${cleanUrl}/${encodeURIComponent(topic)}`

    if (token) {
      const authParam = btoa(`Bearer ${token}`).replace(/=+$/, '')
      url += `?auth=${encodeURIComponent(authParam)}`
    }

    setResult(url)
  }

  function clear() {
    setToken('')
    setTopic('')
    setResult('')
  }

  async function copyWebhook() {
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
      <div className="mx-auto flex max-w-xl flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label className="font-bold text-slate-200">Instance</Label>

          <Input
            className="border border-white/10 bg-white/5 text-slate-50 outline-none transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/15"
            value={instance ?? ''}
            placeholder="No instance configured"
            readOnly
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-bold text-slate-200">Topic</Label>

          <Input
            className="border border-white/10 bg-white/5 text-slate-50 outline-none transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/15"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label className="font-bold text-slate-200">Token</Label>

          <Input
            className="border border-white/10 bg-white/5 text-slate-50 outline-none transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/15"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            type="password"
          />
        </div>

        <div className="flex gap-2">
          <Button
            className="flex-1 cursor-pointer rounded-lg bg-linear-to-br from-teal-600 to-emerald-800 font-semibold text-slate-50"
            onClick={buildUrl}
          >
            Build URL
          </Button>

          <Button
            className="cursor-pointer rounded-lg bg-linear-to-br from-zinc-800 to-zinc-900 font-semibold text-slate-50"
            onClick={clear}
          >
            Clear
          </Button>
        </div>

        {result && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label className="font-bold text-slate-200">Webhook</Label>

              <Button
                size="sm"
                variant="ghost"
                className="cursor-pointer text-slate-300 hover:bg-white/5 hover:text-slate-50"
                onClick={copyWebhook}
              >
                {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
              </Button>
            </div>

            <Textarea
              readOnly
              className="resize-none border border-white/10 bg-white/5 text-slate-50 outline-none transition focus:border-teal-400/70 focus:ring-2 focus:ring-teal-400/15"
              value={result}
              rows={2}
            />
          </div>
        )}
      </div>
    </>
  )
}
