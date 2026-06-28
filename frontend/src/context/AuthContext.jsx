import { createContext, useContext, useState, useEffect } from "react"
import { api } from "../services/api"

const AuthContext = createContext()

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
      const token = localStorage.getItem("revlens_token")
      if (token) {
        try {
          // Verify token and fetch user info
          const userData = await api.getMe()
          setUser(normalizeUser(userData))
        } catch (err) {
          console.error("Failed to restore session:", err)
          localStorage.removeItem("revlens_token")
          localStorage.removeItem("revlens_user")
        }
      }
      setIsLoading(false)
    }
    initAuth()
  }, [])

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password })
      const token = res.accessToken || res.access_token
      localStorage.setItem("revlens_token", token)
      localStorage.setItem("revlens_user", JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Login failed:", err)
      throw err
    }
  }

  const register = async (email, password, fullName) => {
    try {
      const res = await api.register({ email, password, fullName })
      const token = res.accessToken || res.access_token
      localStorage.setItem("revlens_token", token)
      localStorage.setItem("revlens_user", JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Registration failed:", err)
      throw err
    }
  }

  const googleLogin = async (credential) => {
    try {
      const res = await api.googleLogin({ credential })
      const token = res.accessToken || res.access_token
      localStorage.setItem("revlens_token", token)
      localStorage.setItem("revlens_user", JSON.stringify(res.user))
      setUser(normalizeUser(res.user))
      return res.user
    } catch (err) {
      console.error("Google Auth failed:", err)
      throw err
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("revlens_token")
    localStorage.removeItem("revlens_user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
