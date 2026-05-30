import { type Module } from '@/modules/types'

export const systemModule = [
  {
    id: 'hibernate',
    label: 'Hibernate',
    description: 'Hibernate the machine using the operating system power controls.',
  },
  {
    id: 'logout',
    label: 'Log out',
    description: 'Log out the current user from the active operating system session.',
  },
  {
    id: 'reboot',
    label: 'Reboot',
    description: 'Restart the machine using the operating system power controls.',
  },
  {
    id: 'shutdown',
    label: 'Shutdown',
    description: 'Shut down the machine using the operating system power controls.',
  },
  {
    id: 'sleep',
    label: 'Sleep',
    description: 'Put the machine into sleep mode using the operating system power controls.',
  },
] satisfies Module[]
