export type ModuleType = 'text' | 'number' | 'boolean' | 'select'

export interface ModuleOptions {
  label: string
  value: string
}

export interface ModuleField {
  allowVariables?: boolean
  key: string
  label: string
  max?: number
  min?: number
  options?: ModuleOptions[]
  placeholder?: string
  type: ModuleType
}

export interface Module {
  defaultConfig?: Record<string, unknown>
  description?: string
  fields?: ModuleField[]
  id: string
  label: string
}
