import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  fullName?: string
  credits: number
  hasPurchased: boolean
  tipsterFirstView: boolean
  preferredLeagues?: string[]
  goal?: 'betting' | 'fantacalcio' | 'both'
  createdAt?: string
}

interface UserState {
  user: User | null
  credits: number
  hasPurchased: boolean
  tipsterFirstView: boolean
  isLoading: boolean
  isAuthenticated: boolean

  // Actions
  setUser: (user: User | null) => void
  setCredits: (credits: number) => void
  decrementCredits: (amount: number) => boolean
  incrementCredits: (amount: number) => void
  setTipsterFirstView: (viewed: boolean) => void
  setHasPurchased: (purchased: boolean) => void
  setLoading: (isLoading: boolean) => void
  reset: () => void

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signup: (email: string, password: string, fullName?: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  fetchUser: () => Promise<void>

  // Credit actions
  spendCredits: (amount: number, description: string, matchId?: string) => Promise<{ success: boolean; error?: string }>
  checkCredits: (amount: number) => Promise<{ hasEnough: boolean; credits: number }>
  refreshCredits: () => Promise<void>

  // Tipster actions
  checkTipsterAccess: () => Promise<{ isFirstView: boolean; canAccess: boolean; credits: number }>
  markTipsterViewed: () => Promise<void>
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      credits: 0,
      hasPurchased: false,
      tipsterFirstView: false,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({
        user,
        credits: user?.credits || 0,
        hasPurchased: user?.hasPurchased || false,
        tipsterFirstView: user?.tipsterFirstView || false,
        isAuthenticated: !!user
      }),

      setCredits: (credits) => set({ credits }),

      decrementCredits: (amount) => {
        const currentCredits = get().credits
        if (currentCredits >= amount) {
          set({ credits: currentCredits - amount })
          return true
        }
        return false
      },

      incrementCredits: (amount) => set((state) => ({ credits: state.credits + amount })),

      setTipsterFirstView: (viewed) => set({ tipsterFirstView: viewed }),

      setHasPurchased: (purchased) => set({ hasPurchased: purchased }),

      setLoading: (isLoading) => set({ isLoading }),

      reset: () => set({
        user: null,
        credits: 0,
        hasPurchased: false,
        tipsterFirstView: false,
        isLoading: false,
        isAuthenticated: false
      }),

      // Auth actions
      login: async (email, password) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })

          const data = await response.json()

          if (!response.ok) {
            return { success: false, error: data.error || 'Errore durante il login' }
          }

          set({
            user: data.user,
            credits: data.user.credits,
            hasPurchased: data.user.hasPurchased,
            tipsterFirstView: data.user.tipsterFirstView,
            isAuthenticated: true,
          })

          return { success: true }
        } catch (error) {
          return { success: false, error: 'Errore di connessione' }
        }
      },

      signup: async (email, password, fullName) => {
        try {
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, fullName }),
          })

          const data = await response.json()

          if (!response.ok) {
            return { success: false, error: data.error || 'Errore durante la registrazione' }
          }

          return { success: true }
        } catch (error) {
          return { success: false, error: 'Errore di connessione' }
        }
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST' })
        } catch (error) {
          console.error('Logout error:', error)
        }
        set({
          user: null,
          credits: 0,
          tipsterFirstView: false,
          isAuthenticated: false
        })
      },

      fetchUser: async () => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/me')
          const data = await response.json()

          if (data.user) {
            set({
              user: data.user,
              credits: data.user.credits,
              hasPurchased: data.user.hasPurchased,
              tipsterFirstView: data.user.tipsterFirstView,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({
              user: null,
              credits: 0,
              hasPurchased: false,
              tipsterFirstView: false,
              isAuthenticated: false,
              isLoading: false
            })
          }
        } catch (error) {
          console.error('Fetch user error:', error)
          set({ isLoading: false })
        }
      },

      // Credit actions
      spendCredits: async (amount, description, matchId) => {
        try {
          const response = await fetch('/api/credits/spend', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, description, matchId }),
          })

          const data = await response.json()

          if (!response.ok) {
            return { success: false, error: data.error }
          }

          set({ credits: data.credits })
          return { success: true }
        } catch (error) {
          return { success: false, error: 'Errore di connessione' }
        }
      },

      checkCredits: async (amount) => {
        try {
          const response = await fetch('/api/credits/check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount }),
          })

          const data = await response.json()
          return { hasEnough: data.hasEnough, credits: data.credits }
        } catch (error) {
          return { hasEnough: false, credits: get().credits }
        }
      },

      refreshCredits: async () => {
        try {
          const response = await fetch('/api/credits/balance')
          const data = await response.json()

          if (response.ok) {
            set({
              credits: data.credits,
              hasPurchased: data.hasPurchased,
              tipsterFirstView: data.tipsterFirstView
            })
          }
        } catch (error) {
          console.error('Refresh credits error:', error)
        }
      },

      // Tipster actions
      checkTipsterAccess: async () => {
        try {
          const response = await fetch('/api/credits/tipster-check')
          const data = await response.json()

          return {
            isFirstView: data.isFirstView,
            canAccess: data.canRegenerate,
            credits: data.credits,
          }
        } catch (error) {
          return { isFirstView: false, canAccess: false, credits: get().credits }
        }
      },

      markTipsterViewed: async () => {
        try {
          await fetch('/api/credits/tipster-check', { method: 'POST' })
          set({ tipsterFirstView: true })
        } catch (error) {
          console.error('Mark tipster viewed error:', error)
        }
      },
    }),
    {
      name: 'calcioai-user-storage',
      partialize: (state) => ({
        user: state.user,
        credits: state.credits,
        hasPurchased: state.hasPurchased,
        tipsterFirstView: state.tipsterFirstView,
        isAuthenticated: state.isAuthenticated
      }),
    }
  )
)
