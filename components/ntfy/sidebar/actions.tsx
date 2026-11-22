'use client'

import { Clock, Plus, ScrollText, Settings, SquareText, Webhook, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { type SidebarProps } from '@/types/sidebar'

type Props = Pick<SidebarProps, 'addServer' | 'addTopic' | 'preferences'> & {
  hasTopics: boolean
}

export function Actions({ addServer, addTopic, hasTopics, preferences }: Props) {
  return (
    <div className="flex flex-row gap-1.5 border-t border-border pt-3">
      <Button
        className="cursor-pointer rounded transition-all duration-500"
        onClick={addServer}
        size="icon-xs"
        variant="outline"
      >
        <Plus className="size-3" />
      </Button>

      {hasTopics && (
        <Button
          className="cursor-pointer rounded transition-all duration-500"
          onClick={addTopic}
          size="icon-xs"
          variant="outline"
        >
          <SquareText className="size-3" />
        </Button>
      )}

      <Button
        asChild
        className="cursor-pointer rounded transition-all duration-500"
        size="icon-xs"
        variant="outline"
      >
        <a href="/automation/">
          <Workflow className="size-3" />
        </a>
      </Button>

      <Button
        asChild
        className="cursor-pointer rounded transition-all duration-500"
        size="icon-xs"
        variant="outline"
      >
        <a href="/logs/">
          <ScrollText className="size-3" />
        </a>
      </Button>

      <Button
        asChild
        className="cursor-pointer rounded transition-all duration-500"
        size="icon-xs"
        variant="outline"
      >
        <a href="/webhook/">
          <Webhook className="size-3" />
        </a>
      </Button>

      <Button
        asChild
        className="cursor-pointer rounded transition-all duration-500"
        size="icon-xs"
        variant="outline"
      >
        <a href="/schedule/">
          <Clock className="size-3" />
        </a>
      </Button>

      <Button
        className="cursor-pointer rounded transition-all duration-500"
        onClick={preferences}
        size="icon-xs"
        variant="outline"
      >
        <Settings className="size-3" />
      </Button>
    </div>
  )
}
