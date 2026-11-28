import { Inbox, Plus } from 'lucide-react'

import { Card } from '@/components/ntfy/card'
import { Button } from '@/components/ui/button'
import { type useNtfy } from '@/hooks/use-ntfy'
import { type Snapshot } from '@/types/ntfy'

type Props = {
  data: ReturnType<typeof useNtfy>
  expandedId: number | null
  loading: boolean
  onOpenTopic: () => void
  onRemove: (rowId: number) => void
  onToggleExpand: (rowId: number) => void
  search: string
  showTags: boolean
  snapshot: Snapshot
  unreadOnly: boolean
}

export function Messages({
  data,
  expandedId,
  loading,
  onOpenTopic,
  onRemove,
  onToggleExpand,
  search,
  showTags,
  snapshot,
  unreadOnly,
}: Props) {
  return (
    <>
      <div aria-busy={data.loadingMore} className="flex flex-col gap-3">
        {data.messages.map((item) => {
          const source = snapshot.topics.find((entry) => entry.id === item.topicId)
          const name =
            snapshot.servers.find((entry) => entry.id === source?.serverId)?.name ?? 'ntfy'

          return (
            <Card
              expanded={expandedId === item.rowId}
              item={item}
              key={item.rowId}
              onToggleExpand={() => onToggleExpand(item.rowId)}
              refresh={data.refresh}
              remove={() => onRemove(item.rowId)}
              serverName={name}
              showTags={showTags}
              topic={source}
            />
          )
        })}

        {!loading && data.ready && data.messages.length === 0 && (
          <div className="flex min-h-77.5 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Inbox size={35} strokeWidth={1.3} />
            <h2 className="text-base font-semibold text-foreground">
              {snapshot.topics.length === 0
                ? 'Choose your first topic'
                : search || unreadOnly
                  ? 'No notifications'
                  : "You're all caught up"}
            </h2>

            {snapshot.topics.length === 0 && (
              <Button
                className="cursor-pointer duration-500 transition-all gap-1.75 rounded border-border bg-card text-[11px] font-semibold text-accent-foreground enabled:hover:bg-accent"
                onClick={onOpenTopic}
                size="sm"
                variant="outline"
              >
                <Plus size={16} />
                Subscribe
              </Button>
            )}
          </div>
        )}
      </div>

      {data.hasMore && (
        <div className="mt-5 flex justify-center">
          <Button
            className="cursor-pointer duration-500 transition-all text-[11px] font-semibold text-accent-foreground enabled:hover:bg-accent"
            disabled={data.loadingMore}
            onClick={data.loadMore}
            variant="outline"
          >
            Load more
          </Button>
        </div>
      )}
    </>
  )
}
