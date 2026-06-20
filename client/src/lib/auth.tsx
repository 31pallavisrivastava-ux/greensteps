import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, clearToken, hasToken, setToken } from './api'
import type { UserProfile, VehicleDto } from '@carbon/shared'

interface AuthUser extends UserProfile {
  vehicles?: VehicleDto[]
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async () => {
    if (!hasToken()) {
      setUser(null)
      return
    }
    try {
      const me = await api<AuthUser>('/users/me')
      setUser(me)
    } catch {
      clearToken()
      setUser(null)
    }
  }

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(res.token)
    setUser(res.user)
    await refreshUser()
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, state: 'IN-UP' }),
    })
    setToken(res.token)
    setUser(res.user)
    await refreshUser()
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
