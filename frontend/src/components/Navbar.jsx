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
    <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 flex justify-center ${scrolled ? "pt-4 px-4" : "pt-0 px-0"}`}>
      <div 
        className={`relative flex items-center justify-between transition-all duration-500 ease-in-out ${
          scrolled 
            ? "rounded-2xl bg-white/70 dark:bg-black/60 backdrop-blur-xl border border-white/20 dark:border-white/10 shadow-lg shadow-black/5 px-4 py-2 md:px-3 md:py-1.5 gap-3 md:gap-1.5 w-[92%] md:w-auto max-w-[95%]" 
            : "w-full max-w-7xl px-4 sm:px-6 lg:px-8 h-16 sm:h-18 border-b border-transparent bg-transparent"
        }`}
      >
        {scrolled && <div className="absolute inset-0 noise-overlay rounded-2xl pointer-events-none" />}

        {/* Left Side: Logo & Wordmark */}
        <div 
          className={`flex items-center transition-all duration-500 ease-in-out overflow-hidden ${
            scrolled 
              ? "opacity-100 max-w-[250px] scale-100 translate-x-0 pointer-events-auto md:opacity-0 md:max-w-0 md:scale-90 md:-translate-x-5 md:pointer-events-none" 
              : "opacity-100 max-w-[250px] scale-100 translate-x-0 pointer-events-auto"
          }`}
        >
          <Link to="/" className="flex items-center gap-2.5 group whitespace-nowrap" aria-label="RevLens AI home">
            {/* SVG Logo Mark */}
            <span className="relative flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <defs>
                  <linearGradient id="logoGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6d28d9" />
                  </linearGradient>
                </defs>
                <rect width="36" height="36" rx="9" fill="url(#logoGrad)" />
                <rect width="36" height="18" rx="9" fill="white" fillOpacity="0.12" />
                <path d="M10 9h9.5a5 5 0 0 1 0 10H14.5l5.5 8H16l-5.5-8.2V9Z" fill="white" fillOpacity="0.95" />
                <circle cx="26.5" cy="25.5" r="3.5" fill="#06b6d4" />
                <circle cx="26.5" cy="25.5" r="1.5" fill="#22d3ee" fillOpacity="0.7" />
              </svg>
            </span>
            {/* Wordmark */}
            <span className="font-heading text-lg font-bold tracking-tight leading-none">
              <span className="text-(--color-brand-700) dark:text-white">Rev</span>
              <span className="bg-gradient-to-r from-(--color-brand-500) to-(--color-accent-500) dark:from-(--color-brand-300) dark:to-(--color-accent-400) bg-clip-text text-transparent">Lens</span>
              <span className="ml-1 text-[10px] font-semibold tracking-widest text-(--color-muted) dark:text-(--color-muted-dark) uppercase align-middle">AI</span>
            </span>
          </Link>
        </div>

        {/* Center: Navigation Links */}
        <div className="hidden md:flex items-center justify-center gap-1 sm:gap-1.5 flex-1 md:flex-none">
          {navLinks.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              className={({ isActive }) =>
                `px-3.5 sm:px-4.5 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-300 border ${
                  isActive
                    ? "bg-white/40 dark:bg-white/10 border-white/20 dark:border-white/10 text-(--color-brand-600) dark:text-white shadow-xs"
                    : "bg-transparent border-transparent text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-white/20 dark:hover:bg-white/5 hover:border-white/10 dark:hover:border-white/5 hover:text-(--color-brand-500) dark:hover:text-white"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </div>

        {/* Right Side: GitHub Source, Get Started, Theme Toggle */}
        <div 
          className="hidden md:flex items-center gap-2.5 transition-all duration-500 ease-in-out"
          style={{
            opacity: scrolled ? 0 : 1,
            maxWidth: scrolled ? "0px" : "350px",
            transform: scrolled ? "scale(0.9) translateX(20px)" : "scale(1) translateX(0)",
            pointerEvents: scrolled ? "none" : "auto",
            overflow: "hidden"
          }}
        >
          <a
            href="https://github.com/strange-exe/revlens-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-(--color-brand-500)/10 dark:bg-(--color-brand-500)/20 text-(--color-brand-600) dark:text-(--color-accent-400) border border-(--color-brand-500)/20 dark:border-(--color-accent-500)/30 hover:border-(--color-brand-500)/50 dark:hover:border-(--color-accent-400)/60 hover:bg-(--color-brand-500)/20 transition-all shadow-[0_0_12px_rgba(139,92,246,0.06)] dark:shadow-[0_0_12px_rgba(6,182,212,0.12)] cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
            Source
          </a>
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-(--color-brand-600) text-white hover:bg-(--color-brand-700) transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Get Started
          </Link>
          <ThemeToggle />
        </div>

        {/* Mobile Hamburger & Theme Toggle (Always shown on mobile/tablet) */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer text-(--color-muted) dark:text-(--color-muted-dark)"
            aria-expanded={open}
            aria-label="Toggle menu"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer (Always shown on mobile/tablet when open) */}
      {open && (
        <div className="md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl border border-white/20 dark:border-white/10 bg-white/90 dark:bg-black/90 backdrop-blur-xl shadow-xl p-4">
          <div className="space-y-1.5">
            {navLinks.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 border backdrop-blur-md ${
                    isActive
                      ? "bg-white/40 dark:bg-white/10 border-white/20 dark:border-white/10 text-(--color-brand-600) dark:text-white font-semibold"
                      : "bg-transparent border-transparent text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-white/20 dark:hover:bg-white/5 hover:border-white/10 dark:hover:border-white/5 hover:text-(--color-brand-500) dark:hover:text-white"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <Link
              to="/login"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-semibold rounded-xl bg-(--color-brand-600) text-white hover:bg-(--color-brand-700) transition-all shadow-sm w-full mt-2"
              onClick={() => setOpen(false)}
            >
              Get Started
            </Link>
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold rounded-xl bg-(--color-brand-500)/10 dark:bg-(--color-brand-500)/20 text-(--color-brand-600) dark:text-(--color-accent-400) border border-(--color-brand-500)/20 dark:border-(--color-accent-500)/30 hover:border-(--color-brand-500)/50 dark:hover:border-(--color-accent-400)/60 hover:bg-(--color-brand-500)/20 transition-all shadow-[0_0_12px_rgba(139,92,246,0.06)] dark:shadow-[0_0_12px_rgba(6,182,212,0.12)] w-full mt-2"
              onClick={() => setOpen(false)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14" className="mr-1"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              GitHub
            </a>
          </div>
        </div>
      )}
    </nav>
  )
}
