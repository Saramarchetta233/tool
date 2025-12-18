import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types/user'

interface UserState {
  user: User | null
  credits: number
  isLoading: boolean
  setUser: (user: User | null) => void
  setCredits: (credits: number) => void
  decrementCredits: (amount: number) => void
  incrementCredits: (amount: number) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      credits: 0,
      isLoading: true,
      setUser: (user) => set({ user, credits: user?.credits || 0 }),
      setCredits: (credits) => set({ credits }),
      decrementCredits: (amount) => set((state) => ({ credits: state.credits - amount })),
      incrementCredits: (amount) => set((state) => ({ credits: state.credits + amount })),
      setLoading: (isLoading) => set({ isLoading }),
      reset: () => set({ user: null, credits: 0, isLoading: false }),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({ user: state.user, credits: state.credits }),
    }
  )
)