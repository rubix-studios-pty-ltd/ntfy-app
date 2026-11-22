import { type Server, type Snapshot, type Topic } from '@/types/ntfy'

export type SidebarProps = {
  snapshot: Snapshot
  selected: string | null
  select: (id: string | null) => void
  addServer: () => void
  addTopic: () => void
  editServer: (id: string) => void
  preferences: () => void
  busy: boolean
  sorted: () => void
  markRead: (topic: Topic | null) => void
  deleteNotifications: (topic: Topic | null) => void
  toggleMute: (topic: Topic) => void
  editTopic: (topic: Topic) => void
}

export type TopicProps = Pick<
  SidebarProps,
  'selected' | 'select' | 'busy' | 'markRead' | 'deleteNotifications' | 'toggleMute' | 'editTopic'
> & {
  server: Server
  topics: Topic[]
  statuses: Snapshot['statuses']
  disabled: boolean
  onReorder: (serverId: string, ids: string[]) => void
}
