import { createContext, useContext, useState, useEffect } from "react"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for simulated session
    const storedUser = localStorage.getItem("revlens_user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = (email, password) => {
    // Simple mock authentication for "test user"
    // In a real app, you'd validate with a backend API
    const testUser = {
      id: "usr_test123",
      email: email || "test@example.com",
      name: "Test Owner",
      role: "owner"
    }
    setUser(testUser)
    localStorage.setItem("revlens_user", JSON.stringify(testUser))
    return true
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("revlens_user")
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
