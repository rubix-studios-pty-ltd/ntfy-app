'use client'

import { useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'

import { Dialog } from '@/components/automation/dialog'
import { Modal } from '@/components/automation/modal'
import { Table } from '@/components/automation/table'
import { TestDialog } from '@/components/automation/test'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useRules } from '@/hooks/use-rules'
import { type RulesType } from '@/schema/automation'
import { getAction } from '@/utils/getAction'
import { baseStatus } from '@/utils/status'

export function Automation() {
  const { rules, servers, saveRule, deleteRule, toggleRule, testRule } = useRules()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<RulesType | null>(null)
  const [removing, setRemoving] = useState<RulesType | null>(null)
  const [testing, setTesting] = useState<RulesType | null>(null)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rules

    return rules.filter((rule) =>
      [
        rule.name,
        rule.topic,
        servers.find((server) => server.id === rule.serverId)?.name,
        rule.matchValue,
        getAction(rule),
      ].some((value) =>
        String(value ?? '')
          .toLowerCase()
          .includes(query)
      )
    )
  }, [rules, search, servers])

  const addRule = () => {
    const rule = baseStatus()
    if (servers.length === 1) rule.serverId = servers[0].id
    setEditing(rule)
  }

  const save = async () => {
    if (editing && (await saveRule(editing))) setEditing(null)
  }

  const remove = async () => {
    if (removing && (await deleteRule(removing.id))) setRemoving(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button
          className="cursor-pointer duration-500 transition-all"
          onClick={addRule}
          size="icon-sm"
        >
          <Plus />
        </Button>

        <div className="relative flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            className="h-8 w-full bg-transparent pl-9 text-[11px] md:text-[11px] text-foreground"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search…"
            type="search"
            value={search}
          />
        </div>
      </div>

      <Table
        onDelete={setRemoving}
        onEdit={setEditing}
        onTest={async (rule) => {
          if (rule.matchType === 'regex') {
            setTesting(rule)
          } else {
            await testRule(rule)
          }
        }}
        onToggle={toggleRule}
        rules={filtered}
        servers={servers}
      />

      <Dialog onClose={() => setRemoving(null)} onDelete={remove} rule={removing} />
      <TestDialog onClose={() => setTesting(null)} onTest={testRule} rule={testing} />
      <Modal onSave={save} rule={editing} servers={servers} setRule={setEditing} />
    </div>
  )
}
