import { useState, useEffect } from "react"
import { Link, NavLink } from "react-router-dom"
import { Menu, X } from "lucide-react"
import ThemeToggle from "./ThemeToggle"

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/login", label: "Login" },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? "shadow-sm" : ""}`}>
      <div className={`absolute inset-0 transition-all duration-500 ${scrolled ? "bg-(--color-surface)/85 dark:bg-(--color-surface-dark)/85 backdrop-blur-2xl border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60" : "bg-transparent"}`} />
      <div className={`absolute inset-0 transition-opacity duration-500 ${scrolled ? "opacity-100" : "opacity-0"} noise-overlay`} />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          <Link to="/" className="flex items-center gap-2.5 group">
            <span className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) flex items-center justify-center text-white text-sm font-bold shadow-sm overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <span className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/20" />
              R
            </span>
            <span className="font-heading text-lg font-bold tracking-tight">
              <span className="text-(--color-brand-600) dark:text-white">Rev</span>
              <span className="text-(--color-gold-500) dark:text-(--color-gold-400)">Lens</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                className={({ isActive }) =>
                  `relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${isActive ? "text-(--color-brand-600) dark:text-white" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-white"}`
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <span className="absolute -bottom-0.5 left-2 right-2 h-0.5 rounded-full bg-gradient-to-r from-(--color-brand-400) to-(--color-gold-400)" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-(--color-brand-50) dark:bg-(--color-brand-800) text-(--color-brand-600) dark:text-(--color-brand-300) hover:bg-(--color-brand-100) dark:hover:bg-(--color-brand-700) transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              Source
            </a>
            <ThemeToggle />
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-(--color-muted) dark:text-(--color-muted-dark)"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface)/95 dark:bg-(--color-surface-dark)/95 backdrop-blur-xl">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-(--color-brand-100) dark:bg-(--color-brand-800) text-(--color-brand-600) dark:text-(--color-gold-400)" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-black/5 dark:hover:bg-white/5"}`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
