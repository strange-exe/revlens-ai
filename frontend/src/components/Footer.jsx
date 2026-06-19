import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="relative border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) overflow-hidden">
      <div className="absolute inset-0 noise-overlay" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5 group" aria-label="RevLens AI home">
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <defs>
                    <linearGradient id="footerLogoGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#6d28d9" />
                    </linearGradient>
                  </defs>
                  <rect width="36" height="36" rx="9" fill="url(#footerLogoGrad)" />
                  <rect width="36" height="18" rx="9" fill="white" fillOpacity="0.12" />
                  <path d="M10 9h9.5a5 5 0 0 1 0 10H14.5l5.5 8H16l-5.5-8.2V9Z" fill="white" fillOpacity="0.95" />
                  <circle cx="26.5" cy="25.5" r="3.5" fill="#06b6d4" />
                  <circle cx="26.5" cy="25.5" r="1.5" fill="#22d3ee" fillOpacity="0.7" />
                </svg>
              </span>
              <span className="font-heading text-base font-bold leading-none">
                <span className="text-(--color-brand-700) dark:text-white">Rev</span>
                <span className="bg-gradient-to-r from-(--color-brand-500) to-(--color-accent-500) dark:from-(--color-brand-300) dark:to-(--color-accent-400) bg-clip-text text-transparent">Lens</span>
                <span className="ml-0.5 text-[9px] font-semibold tracking-widest text-(--color-muted) dark:text-(--color-muted-dark) uppercase align-middle">AI</span>
              </span>
            </Link>
            <p className="mt-4 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-xs">
              AI-powered review intelligence for homestay owners. Understand your guests better, grow your business smarter.
            </p>
          </div>
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--color-muted) dark:text-(--color-muted-dark) mb-4">Navigate</h4>
            <div className="space-y-2.5">
              {[
                { to: "/", label: "Home" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/pricing", label: "Pricing" },
                { to: "/about", label: "About" },
                { to: "/login", label: "Login" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-(--color-brand-300) transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--color-muted) dark:text-(--color-muted-dark) mb-4">Connect</h4>
            <div className="space-y-2.5">
              <a
                href="https://github.com/strange-exe"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-(--color-brand-300) transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
                GitHub
              </a>
              <a
                href="https://instagram.com/_abhinesh.exe/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500) dark:hover:text-(--color-brand-300) transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M7.75 2C4.57 2 2 4.57 2 7.75v8.5C2 19.43 4.57 22 7.75 22h8.5C19.43 22 22 19.43 22 16.25v-8.5C22 4.57 19.43 2 16.25 2h-8.5zm0 2h8.5A3.75 3.75 0 0 1 20 7.75v8.5A3.75 3.75 0 0 1 16.25 20h-8.5A3.75 3.75 0 0 1 4 16.25v-8.5A3.75 3.75 0 0 1 7.75 4zM17.5 5.5a1 1 0 1 0 0 2 1 1 0 0 0 0-2zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" /></svg>
                Instagram
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-[11px] font-bold tracking-[0.15em] uppercase text-(--color-muted) dark:text-(--color-muted-dark) mb-4">Stack</h4>
            <div className="space-y-1.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
              {["React + Vite", "Tailwind CSS", "Cloudflare Workers", "Cloudflare D1", "Gemini AI"].map((s) => (
                <p key={s}>{s}</p>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
          <p>&copy; {new Date().getFullYear()} RevLens AI. All rights reserved.</p>
          <p>Built for homestay owners & tourists</p>
        </div>
      </div>
    </footer>
  )
}
