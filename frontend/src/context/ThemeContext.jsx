import React, { createContext, use, useEffect, useState, useMemo } from "react"

const ThemeContext = createContext()

const THEME_COLORS = { light: "#155c3d", dark: "#000000" }

// Read once at module level to prevent repeated reads on every render
const initialStoredTheme = typeof window !== "undefined" ? localStorage.getItem("theme") : null
const hasExplicitTheme = !!initialStoredTheme

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    if (initialStoredTheme) return initialStoredTheme
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  })

  // Apply class + meta-tag on every theme change
  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle("dark", theme === "dark")
    localStorage.setItem("theme", theme)
    const meta = document.getElementById("theme-color-meta")
    if (meta) meta.setAttribute("content", THEME_COLORS[theme])
  }, [theme])

  // Track OS preference — only auto-switch when user hasn't made an explicit choice
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e) => {
      if (!hasExplicitTheme) {
        setTheme(e.matches ? "dark" : "light")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"))

  const isDark = theme === "dark"
  const value = useMemo(() => ({ theme, toggleTheme, isDark }), [theme, isDark])

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
