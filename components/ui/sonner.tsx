'use client'

import { useTheme } from 'next-themes'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const toastStyle = {
  background: 'rgb(2 6 23)',
  color: 'rgb(248 250 252)',
  border: '1px solid rgba(255, 255, 255, 0.10)',
} satisfies React.CSSProperties

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      theme={theme as ToasterProps['theme']}
      toastOptions={{
        style: toastStyle,
        classNames: {
          toast: 'border shadow-2xl',
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
