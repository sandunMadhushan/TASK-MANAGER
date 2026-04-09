import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import { fetchMeApi, loginApi, setAuthTokenGetter, signupApi } from '@/services/task-api'
import type { User } from '@/types/user'

type AuthStore = {
  accessToken: string | null
  currentUser: User | null
  isBootstrapping: boolean
  isLoggingIn: boolean
  isSigningUp: boolean
  login: (input: { email: string; password: string }) => Promise<boolean>
  signup: (input: { name: string; email: string; password: string }) => Promise<boolean>
  setCurrentUser: (user: User) => void
  bootstrap: () => Promise<void>
  logout: () => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      accessToken: null,
      currentUser: null,
      isBootstrapping: true,
      isLoggingIn: false,
      isSigningUp: false,
      login: async (input) => {
        set({ isLoggingIn: true })
        try {
          const session = await loginApi(input)
          set({
            accessToken: session.accessToken,
            currentUser: session.user,
            isLoggingIn: false,
          })
          return true
        } catch {
          set({ isLoggingIn: false })
          return false
        }
      },
      signup: async (input) => {
        set({ isSigningUp: true })
        try {
          const session = await signupApi(input)
          set({
            accessToken: session.accessToken,
            currentUser: session.user,
            isSigningUp: false,
          })
          return true
        } catch {
          set({ isSigningUp: false })
          return false
        }
      },
      setCurrentUser: (user) => {
        set({ currentUser: user })
      },
      bootstrap: async () => {
        const token = get().accessToken
        if (!token) {
          set({ isBootstrapping: false, currentUser: null })
          return
        }
        try {
          const user = await fetchMeApi()
          set({ currentUser: user, isBootstrapping: false })
        } catch {
          set({
            accessToken: null,
            currentUser: null,
            isBootstrapping: false,
          })
        }
      },
      logout: () => {
        set({
          accessToken: null,
          currentUser: null,
        })
      },
    }),
    {
      name: 'task-manager-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        currentUser: state.currentUser,
      }),
      onRehydrateStorage: () => (state) => {
        setAuthTokenGetter(() => state?.accessToken ?? null)
      },
    }
  )
)

setAuthTokenGetter(() => useAuthStore.getState().accessToken)

