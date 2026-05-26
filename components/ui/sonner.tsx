'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: 'border border-white/10 bg-slate-950 text-slate-50 shadow-2xl',
          title: 'text-sm font-semibold text-slate-50',
          description: 'text-sm text-slate-400',
          actionButton: 'bg-teal-600 text-slate-50 hover:bg-teal-500',
          cancelButton: 'bg-zinc-800 text-slate-50 hover:bg-zinc-700',
          closeButton: 'border-white/10 bg-slate-900 text-slate-400 hover:text-slate-50',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
