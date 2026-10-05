import { useState, useEffect } from "react"
import { Link, NavLink } from "react-router-dom"
import { Menu, X } from "lucide-react"
import ThemeToggle from "./ThemeToggle"
import Logo from "./Logo"
import { useAuth } from "../context/AuthContext"

// Logged-out visitors get one primary action ("Start free"); the logo is the way home.
const navLinks = [
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
]

const linkClass = ({ isActive }) =>
  `text-sm font-medium transition-colors ${isActive
    ? "text-(--color-ink) dark:text-white"
    : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-ink) dark:hover:text-white"}`

const primary = "inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-lg bg-(--color-brand-600) text-white hover:bg-(--color-brand-700) transition-colors"

export default function Navbar() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const actions = user ? (
    <Link to="/dashboard" className={primary} onClick={() => setOpen(false)}>Open dashboard</Link>
  ) : (
    <>
      <NavLink to="/login" className={linkClass} onClick={() => setOpen(false)}>Log in</NavLink>
      <Link to="/login?mode=signup" className={primary} onClick={() => setOpen(false)}>Start free</Link>
    </>
  )

  return (
    <nav className={`fixed top-0 inset-x-0 z-50 border-b bg-(--color-surface) dark:bg-(--color-surface-dark) transition-colors duration-200 ${scrolled || open
      ? "border-(--color-border) dark:border-(--color-border-dark)" : "border-transparent"}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        <Logo />

        <div className="hidden md:flex items-center gap-8 flex-1 ml-6">
          {navLinks.map((l) => <NavLink key={l.to} to={l.to} className={linkClass}>{l.label}</NavLink>)}
        </div>

        <div className="hidden md:flex items-center gap-5">
          {actions}
          <ThemeToggle />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg text-(--color-ink) dark:text-white hover:bg-black/5 dark:hover:bg-white/10 cursor-pointer"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="md:hidden border-t border-(--color-border) dark:border-(--color-border-dark) px-4 pb-5 pt-3 flex flex-col gap-4">
          {navLinks.map((l) => <NavLink key={l.to} to={l.to} className={linkClass} onClick={() => setOpen(false)}>{l.label}</NavLink>)}
          <div className="flex flex-col gap-3 pt-2 [&>a:last-child]:w-full">{actions}</div>
        </div>
      )}
    </nav>
  )
}
