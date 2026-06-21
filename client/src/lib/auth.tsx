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
  refreshUser: (opts?: { clearOnFailure?: boolean }) => Promise<AuthUser | null>
  setUserProfile: (user: AuthUser) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = async (opts?: { clearOnFailure?: boolean }) => {
    const clearOnFailure = opts?.clearOnFailure ?? true
    if (!hasToken()) {
      setUser(null)
      return null
    }
    try {
      const me = await api<AuthUser>('/users/me')
      setUser(me)
      return me
    } catch {
      if (clearOnFailure) {
        clearToken()
        setUser(null)
      }
      return null
    }
  }

  const setUserProfile = (profile: AuthUser) => {
    setUser((prev) => ({
      ...(prev ?? {}),
      ...profile,
      onboardingCompleted: profile.onboardingCompleted === true,
    } as AuthUser))
  }

  useEffect(() => {
    refreshUser({ clearOnFailure: true }).finally(() => setLoading(false))
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    setToken(res.token)
    setUser(res.user)
    await refreshUser({ clearOnFailure: false })
  }

  const register = async (email: string, password: string, name?: string) => {
    const res = await api<{ token: string; user: AuthUser }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, state: 'IN-UP' }),
    })
    setToken(res.token)
    setUser(res.user)
    await refreshUser({ clearOnFailure: false })
  }

  const logout = () => {
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, setUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
