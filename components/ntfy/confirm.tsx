'use client'

import { useState } from 'react'

import { Modal } from '@/components/ntfy/modal'
import { Button } from '@/components/ui/button'

type Props = {
  title: string
  description: string
  action: () => Promise<void>
  close: () => void
}

export function Confirm({ title, description, action, close }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  return (
    <Modal busy={busy} close={close} description={description} title={title}>
      <div className="mt-1.25 flex flex-col gap-4.5">
        {error && (
          <p
            className="rounded-md bg-danger-soft p-2.5 text-[11px] leading-[1.7] text-danger-foreground"
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
            variant="outline"
          >
            Cancel
          </Button>

          <Button
            className="cursor-pointer duration-500 transition-all"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await action()
                close()
              } catch (failure) {
                setError(String(failure))
              } finally {
                setBusy(false)
              }
            }}
            size="sm"
            variant="destructive"
          >
            {busy ? 'Removing…' : 'Remove'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
