'use client'

import { type ReactNode } from 'react'
import { useSortable } from '@dnd-kit/react/sortable'

import { cn } from '@/lib/utils'

type HandleRef = ReturnType<typeof useSortable>['handleRef']

type Props = {
  id: string
  index: number
  disabled: boolean
  className?: string
  children: (handleRef: HandleRef) => ReactNode
}

export function SortableItem({ id, index, disabled, className, children }: Props) {
  const { ref, handleRef, isDragging, isDropTarget } = useSortable({ id, index, disabled })

  return (
    <div
      className={cn(
        'relative',
        isDragging && 'z-10 opacity-60',
        isDropTarget && 'rounded-md bg-accent/40',
        className
      )}
      ref={ref}
    >
      {children(handleRef)}
    </div>
  )
}
