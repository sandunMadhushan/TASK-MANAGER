import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TaskSortOption = 'due-asc' | 'due-desc' | 'newest' | 'oldest' | 'title'

type SettingsStore = {
  reducedMotion: boolean
  compactCards: boolean
  defaultTaskSort: TaskSortOption
  setReducedMotion: (enabled: boolean) => void
  setCompactCards: (enabled: boolean) => void
  setDefaultTaskSort: (value: TaskSortOption) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      reducedMotion: false,
      compactCards: false,
      defaultTaskSort: 'due-asc',
      setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
      setCompactCards: (enabled) => set({ compactCards: enabled }),
      setDefaultTaskSort: (value) => set({ defaultTaskSort: value }),
    }),
    {
      name: 'task-manager-settings',
    }
  )
)

