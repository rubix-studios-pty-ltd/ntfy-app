import { type ComponentProps } from 'react'
import {
  Activity,
  Bell,
  Cloud,
  Cpu,
  Database,
  Globe,
  HardDrive,
  House,
  Mail,
  Monitor,
  Server,
  ShieldCheck,
  Terminal,
  TriangleAlert,
  Webhook,
  Wifi,
} from 'lucide-react'

export const topicIcons = {
  bell: Bell,
  activity: Activity,
  'shield-check': ShieldCheck,
  server: Server,
  database: Database,
  cloud: Cloud,
  wifi: Wifi,
  monitor: Monitor,
  mail: Mail,
  globe: Globe,
  cpu: Cpu,
  'hard-drive': HardDrive,
  terminal: Terminal,
  house: House,
  webhook: Webhook,
  'triangle-alert': TriangleAlert,
} as const

export type Icon = keyof typeof topicIcons

type Props = ComponentProps<typeof Bell> & {
  name: Icon
}

export function TopicIcon({ name, ...props }: Props) {
  const Icon = topicIcons[name] ?? Bell

  return <Icon {...props} />
}
