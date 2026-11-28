'use client'

import { Clock, Plus, ScrollText, Settings, SquareText, Webhook, Workflow } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { type SidebarProps } from '@/types/sidebar'

type Props = Pick<SidebarProps, 'addServer' | 'addTopic' | 'preferences'> & {
  hasTopics: boolean
}

export function Actions({ addServer, addTopic, hasTopics, preferences }: Props) {
  return (
    <TooltipProvider>
      <div className="flex flex-row gap-1.5 border-t border-border pt-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Add server"
              className="cursor-pointer rounded transition-all duration-500"
              onClick={addServer}
              size="icon-xs"
              variant="outline"
            >
              <Plus className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Add server</TooltipContent>
        </Tooltip>

        {hasTopics && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label="Add topic"
                className="cursor-pointer rounded transition-all duration-500"
                onClick={addTopic}
                size="icon-xs"
                variant="outline"
              >
                <SquareText className="size-3" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Add topic</TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="cursor-pointer rounded transition-all duration-500"
              size="icon-xs"
              variant="outline"
            >
              <a aria-label="Automation" href="/automation/">
                <Workflow className="size-3" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Automation</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="cursor-pointer rounded transition-all duration-500"
              size="icon-xs"
              variant="outline"
            >
              <a aria-label="Logs" href="/logs/">
                <ScrollText className="size-3" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Logs</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="cursor-pointer rounded transition-all duration-500"
              size="icon-xs"
              variant="outline"
            >
              <a aria-label="Webhook" href="/webhook/">
                <Webhook className="size-3" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Webhook</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              className="cursor-pointer rounded transition-all duration-500"
              size="icon-xs"
              variant="outline"
            >
              <a aria-label="Schedule" href="/schedule/">
                <Clock className="size-3" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Schedule</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Preferences"
              className="cursor-pointer rounded transition-all duration-500"
              onClick={preferences}
              size="icon-xs"
              variant="outline"
            >
              <Settings className="size-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Preferences</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}
