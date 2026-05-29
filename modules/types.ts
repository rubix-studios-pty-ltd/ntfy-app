export type ModuleType = 'text' | 'number' | 'boolean' | 'select'

export interface ModuleOptions {
  label: string
  value: string
}

export interface ModuleField {
  key: string
  label: string
  type: ModuleType
  placeholder?: string
  min?: number
  max?: number
  allowVariables?: boolean
  options?: ModuleOptions[]
}

export interface Module {
  id: string
  label: string
  description?: string
  defaultConfig?: Record<string, unknown>
  fields?: ModuleField[]
}
