import { type Module } from '@/modules/types'

export const screenModule = [
  {
    id: 'takeScreenshot',
    label: 'Take screenshot',
    description: 'Capture the primary screen and save it as a PNG file.',
    defaultConfig: {
      directory: '',
      filename: '',
    },
    fields: [
      {
        key: 'directory',
        label: 'Directory',
        type: 'text',
        allowVariables: true,
        placeholder: 'Leave blank for the default screenshots folder',
      },
      {
        key: 'filename',
        label: 'Filename',
        type: 'text',
        allowVariables: true,
        placeholder: 'Leave blank for sc-{date-time}.png',
      },
    ],
  },
] satisfies Module[]
