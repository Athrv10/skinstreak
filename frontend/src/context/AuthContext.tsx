/**
 * AuthContext.tsx — Global Authentication Context & Provider.
 *
 * Handles login, signup, logout and token validation.
 * Listens to the 'auth:logout' CustomEvent dispatched by the API client
 * interceptor whenever a 401 response is received — enabling automatic
 * logout when a JWT token expires.
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMeApi, loginApi, logoutApi, signupApi, type User } from '../api/auth'

export interface AuthContextType {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const TOKEN_KEY = 'skinstreak_token'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Centralized logout logic (also called by the 401 interceptor event)
  const performLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }, [])

  // Listen for 401 auto-logout events dispatched by the API interceptor
  useEffect(() => {
    const handleAutoLogout = () => performLogout()
    window.addEventListener('auth:logout', handleAutoLogout)
    return () => window.removeEventListener('auth:logout', handleAutoLogout)
  }, [performLogout])

  // Verify stored token once on initial load. login()/signup() already set
  // `user` directly from their response, and the 401 interceptor's
  // 'auth:logout' event is handled by the effect above — so this doesn't
  // need to re-run on every token change, which previously caused a
  // redundant duplicate /auth/me request right after every login/signup.
  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false)
        return
      }

      try {
        const userData = await getMeApi(token)
        setUser(userData)
      } catch {
        // Invalid or expired token — clear it
        performLogout()
      } finally {
        setIsLoading(false)
      }
    }

    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    const res = await loginApi({ email, password })
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  const signup = async (name: string, email: string, password: string) => {
    const res = await signupApi({ name, email, password })
    localStorage.setItem(TOKEN_KEY, res.access_token)
    setToken(res.access_token)
    setUser(res.user)
  }

  const logout = async () => {
    try {
      await logoutApi()
    } catch {
      // Ignore network errors on logout
    } finally {
      performLogout()
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- hook is tightly coupled to AuthProvider above; not worth a separate file
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
