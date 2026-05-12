'use client'

import { create } from 'zustand'

import { type InstanceState } from '@/types/instance'

export const useStore = create<InstanceState>((set) => ({
  instance: null,
  setInstance: (value) => set({ instance: value }),
}))
