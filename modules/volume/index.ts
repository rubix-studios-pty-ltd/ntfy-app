import { type Module } from '@/modules/types'

export const volumeModule = [
  {
    id: 'volSet',
    label: 'Set volume',
    description: 'Set the system volume to a specific level.',
    defaultConfig: {
      volume: 50,
    },
    fields: [
      {
        key: 'volume',
        label: 'Volume',
        type: 'number',
        min: 0,
        max: 100,
        allowVariables: true,
        placeholder: '50 or $value',
      },
    ],
  },
  {
    id: 'volInc',
    label: 'Increase volume',
    description: 'Increase the system volume by a set amount.',
    defaultConfig: {
      amount: 10,
    },
    fields: [
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        min: 1,
        max: 100,
        allowVariables: true,
        placeholder: '10 or $value',
      },
    ],
  },
  {
    id: 'volDown',
    label: 'Decrease volume',
    description: 'Decrease the system volume by a set amount.',
    defaultConfig: {
      amount: 10,
    },
    fields: [
      {
        key: 'amount',
        label: 'Amount',
        type: 'number',
        min: 1,
        max: 100,
        allowVariables: true,
        placeholder: '10 or $value',
      },
    ],
  },
  {
    id: 'volMute',
    label: 'Toggle mute',
    description: 'Toggle system mute on or off.',
    defaultConfig: {},
    fields: [],
  },
] satisfies Module[]
