import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

const api = axios.create({ baseURL: '/' })

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      setToken: (token) => {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        set({ token })
      },

      register: async (username, email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/register', { username, email, password })
          get().setToken(data.access_token)
          set({ user: data.user, isLoading: false })
          return true
        } catch (e) {
          set({ error: e.response?.data?.detail || 'Registration failed', isLoading: false })
          return false
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          get().setToken(data.access_token)
          set({ user: data.user, isLoading: false })
          return true
        } catch (e) {
          set({ error: e.response?.data?.detail || 'Login failed', isLoading: false })
          return false
        }
      },

      logout: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, token: null })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'visualai-auth',
      partialize: (s) => ({ user: s.user, token: s.token }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${state.token}`
        }
      },
    }
  )
)
