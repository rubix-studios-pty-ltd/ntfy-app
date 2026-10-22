'use client'

import { useId } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type Props = {
  title: string
  description: string
  children: React.ReactNode
  close: () => void
  busy?: boolean
}

export function Modal({ title, description, children, close, busy = false }: Props) {
  const id = useId()

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open && !busy) close()
      }}
      open
    >
      <DialogContent
        aria-describedby={id}
        className="max-h-[calc(100dvh-2rem)] overflow-y-auto border-border text-foreground shadow-2xl sm:max-w-md"
        onEscapeKeyDown={(event) => {
          if (busy) event.preventDefault()
        }}
        onInteractOutside={(event) => {
          if (busy) event.preventDefault()
        }}
        showCloseButton={!busy}
      >
        <DialogHeader>
          <DialogTitle className="text-[19px] tracking-[-0.3px]">{title}</DialogTitle>

          <DialogDescription className="text-xs leading-[1.8] text-muted-foreground" id={id}>
            {description}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
