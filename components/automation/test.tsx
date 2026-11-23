'use client'

import { useState } from 'react'

import { Modal } from '@/components/ntfy/modal'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { type RulesType } from '@/schema/automation'

type Props = {
  rule: RulesType | null
  onClose: () => void
  onTest: (rule: RulesType, message: string) => Promise<boolean>
}

export function TestDialog({ rule, onClose, onTest }: Props) {
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  if (!rule) return null

  return (
    <Modal
      busy={busy}
      close={onClose}
      description="Enter a sample notification body to match against the selected rule."
      title="Test Regex"
    >
      <Textarea
        autoFocus
        id="regex-test-message"
        onChange={(event) => setMessage(event.target.value)}
        rows={4}
        value={message}
      />

      <DialogFooter>
        <Button
          className="cursor-pointer duration-500 transition-all"
          disabled={busy}
          onClick={onClose}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>

        <Button
          className="cursor-pointer duration-500 transition-all"
          disabled={busy || !message.trim()}
          onClick={async () => {
            setBusy(true)

            try {
              if (await onTest(rule, message)) {
                setMessage('')
                onClose()
              }
            } finally {
              setBusy(false)
            }
          }}
          type="button"
        >
          Test
        </Button>
      </DialogFooter>
    </Modal>
  )
}
