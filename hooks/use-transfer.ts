import { useRef } from 'react'
import { toast } from 'sonner'

import { type RulesType } from '@/schema/automation'
import { type Server } from '@/types/ntfy'
import { stripRule } from '@/utils/stripRule'

export function useTransfer(
  rule: RulesType,
  servers: Server[],
  setRule: (rule: RulesType | null) => void
) {
  const importInput = useRef<HTMLInputElement>(null)

  const exportRule = () => {
    const exportData = {
      type: 'ntfy-app-rule',
      version: 1,
      exportedAt: new Date().toISOString(),
      rule: stripRule(rule),
    }

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')

    link.href = url
    link.download = `${rule.name || 'automation-rule'}.json`
    link.click()

    URL.revokeObjectURL(url)

    toast.success('Rule exported.')
  }

  const importRule = async (file: File) => {
    try {
      const text = await file.text()
      const json = JSON.parse(text)

      const importedRule = json?.type === 'ntfy-app-rule' ? json.rule : json

      if (!importedRule?.name || !importedRule?.topic || !importedRule?.matchType) {
        throw new Error('Invalid rule file')
      }

      const imported = stripRule(importedRule) as Partial<RulesType>

      const serverId = servers.some((server) => server.id === imported.serverId)
        ? imported.serverId
        : servers.length === 1
          ? servers[0].id
          : ''

      setRule({
        ...rule,
        ...imported,
        serverId,
        active: false,
      } as RulesType)
    } catch {
      toast.error('Invalid automation file.')
    } finally {
      if (importInput.current) {
        importInput.current.value = ''
      }
    }
  }

  return { importInput, importRule, exportRule }
}
