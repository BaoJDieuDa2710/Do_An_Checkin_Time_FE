import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { User } from "../types"
import { tokenManager } from "../lib/axios"

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User, tokens: { access_token: string; refresh_token: string }) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user, tokens) => {
        tokenManager.setTokens(tokens.access_token, tokens.refresh_token)
        set({ user, isAuthenticated: true })
      },
      logout: () => {
        tokenManager.clearTokens()
        set({ user: null, isAuthenticated: false })
        window.location.href = "/login"
      },
      updateUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    },
  ),
)
