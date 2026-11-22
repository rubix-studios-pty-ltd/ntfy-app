import { useMemo } from 'react'

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination'
import { getPages } from '@/utils/getPages'

type Props = {
  onPageChange: (page: number) => void
  page: number
  totalPages: number
}

export function LogsPagination({ page, totalPages, onPageChange }: Props) {
  const pages = useMemo(() => getPages(page, totalPages), [page, totalPages])

  if (totalPages <= 1) return null

  return (
    <Pagination>
      <PaginationContent>
        {pages.map((entry, index) =>
          typeof entry === 'number' ? (
            <PaginationItem key={entry}>
              <PaginationLink
                href="#"
                isActive={entry === page}
                onClick={(event) => {
                  event.preventDefault()
                  onPageChange(entry)
                }}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ) : (
            <PaginationItem key={`${entry}-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          )
        )}
      </PaginationContent>
    </Pagination>
  )
}
