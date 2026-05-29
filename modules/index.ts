import { type Module } from '@/modules/types'
import { volumeModule } from '@/modules/volume'

export const moduleOptions = [...volumeModule] satisfies Module[]

export const moduleMap: Record<string, Module> = Object.fromEntries(
  moduleOptions.map((module) => [module.id, module])
)

export const getOptions = (moduleId: string) => {
  return moduleMap[moduleId]
}

export const getDefault = (moduleId: string) => {
  const module = getOptions(moduleId)

  return structuredClone(module?.defaultConfig ?? {})
}
