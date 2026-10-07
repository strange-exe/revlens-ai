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
    trainingConsentAt: u.trainingConsentAt ?? u.training_consent_at ?? null,
    trainingConsentVersion: u.trainingConsentVersion ?? u.training_consent_version ?? null,
  }
}

function cachedUser() {
  try {
    if (!localStorage.getItem(TOKEN_KEY)) return null
    return normalizeUser(JSON.parse(localStorage.getItem(USER_KEY)))
  } catch {
    return null
  }
}

export function AuthProvider({ children }) {
  // Trust the cached user straight away so the dashboard can start loading data immediately.
  // The token is still verified in the background; an expired one gets a 401, which api.js turns
  // into a redirect to /login, so nothing is shown that the server wouldn't allow.
  const [user, setUser] = useState(cachedUser)
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(TOKEN_KEY) && !cachedUser())

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) return
    let cancelled = false
    api.getMe()
      .then((userData) => {
        if (cancelled) return
        localStorage.setItem(USER_KEY, JSON.stringify(userData))
        setUser(normalizeUser(userData))
      })
      .catch((err) => {
        // Only a rejected token ends the session; a network blip keeps the cached user
        if (cancelled || err.status !== 401) return
        localStorage.removeItem(TOKEN_KEY)
        localStorage.removeItem(USER_KEY)
        setUser(null)
      })
      .finally(() => !cancelled && setIsLoading(false))
    return () => { cancelled = true }
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
    try {
      // Shared computers: don't leave the dashboard cache behind
      Object.keys(sessionStorage).filter((k) => k.startsWith("revlens_data:")).forEach((k) => sessionStorage.removeItem(k))
    } catch {
      // storage blocked: nothing was cached
    }
  }, [])

  const setTrainingConsent = useCallback(async (consent) => {
    const updated = await api.setTrainingConsent(consent)
    localStorage.setItem(USER_KEY, JSON.stringify(updated))
    setUser(normalizeUser(updated))
    return updated
  }, [])

  // Deletes on the server only. The caller leaves the dashboard and then calls logout(): logging out while still
  // on a protected page would let the route guard redirect to /login first.
  const deleteAccount = useCallback((confirmEmail) => api.deleteAccount(confirmEmail), [])

  const value = useMemo(() => ({
    user,
    isLoading,
    login,
    register,
    googleLogin,
    logout,
    setTrainingConsent,
    deleteAccount,
  }), [user, isLoading, login, register, googleLogin, logout, setTrainingConsent, deleteAccount])

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
