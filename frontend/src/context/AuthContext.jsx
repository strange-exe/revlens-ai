import React, { createContext, use, useState, useEffect, useMemo, useCallback } from "react"
import { api } from "../services/api"

const AuthContext = createContext()

const TOKEN_KEY = "revlens_token:v1"
const USER_KEY = "revlens_user:v1"

function normalizeUser(u) {
  if (!u) return null
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName || u.full_name || null,
    picture: u.picture || null,
    googleId: u.googleId || u.google_id || null,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Validate session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY)
      if (token) {
        try {
          // Verify token and fetch user info
          const userData = await api.getMe()
          setUser(normalizeUser(userData))
        } catch (err) {
          console.error("Failed to restore session:", err)
          localStorage.removeItem(TOKEN_KEY)
          localStorage.removeItem(USER_KEY)
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = useCallback(async (email, password) => {
    try {
      const res = await api.login({ email, password })
      const token = res.accessToken || res.access_token
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Login failed:", err)
      throw err
    }
  }, [])

  const register = useCallback(async (email, password, fullName) => {
    try {
      const res = await api.register({ email, password, fullName })
      const token = res.accessToken || res.access_token
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Registration failed:", err)
      throw err
    }
  }, [])

  const googleLogin = useCallback(async (credential) => {
    try {
      const res = await api.googleLogin({ credential })
      const token = res.accessToken || res.access_token
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Google Auth failed:", err)
      throw err
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }, [])

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    googleLogin,
    logout
  }), [user, isLoading, login, register, googleLogin, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = use(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
