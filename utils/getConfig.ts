import { type ModuleField } from '@/modules/types'

export const getConfig = (value: unknown) => {
  if (value === undefined || value === null) {
    return ''
  }

  return String(value)
}

export const parseConfig = (field: ModuleField, rawValue: string) => {
  const value = rawValue.trim()

  if (!value) {
    return undefined
  }

  if (field.type === 'number') {
    if (field.allowVariables && value.includes('$')) {
      return value
    }

    const numberValue = Number(value)

    if (Number.isFinite(numberValue)) {
      return numberValue
    }

    return value
  }

  if (field.type === 'boolean') {
    return value === 'true'
  }

  return value
}
