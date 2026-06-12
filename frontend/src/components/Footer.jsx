import { Link } from "react-router-dom"

export default function Footer() {
  return (
    <footer className="border-t border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface] dark:bg-[--color-surface-dark]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-[--color-brand-500] flex items-center justify-center text-white text-xs font-bold">R</span>
              <span className="font-heading text-lg font-bold text-[--color-brand-600] dark:text-[--color-brand-300] tracking-tight">
                RevLens
              </span>
            </div>
            <p className="mt-3 text-sm text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed max-w-xs">
              AI-powered review intelligence for homestay owners. Understand your guests better.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[--color-muted] dark:text-[--color-muted-dark] mb-3">Pages</h4>
            <div className="space-y-2">
              {[
                { to: "/", label: "Home" },
                { to: "/dashboard", label: "Dashboard" },
                { to: "/about", label: "About" },
              ].map((l) => (
                <Link key={l.to} to={l.to} className="block text-sm text-[--color-muted] dark:text-[--color-muted-dark] hover:text-[--color-brand-500] dark:hover:text-[--color-brand-300] transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[--color-muted] dark:text-[--color-muted-dark] mb-3">Connect</h4>
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-[--color-muted] dark:text-[--color-muted-dark] hover:text-[--color-brand-500] dark:hover:text-[--color-brand-300] transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              GitHub
            </a>
          </div>
          <div>
            <h4 className="text-xs font-semibold tracking-widest uppercase text-[--color-muted] dark:text-[--color-muted-dark] mb-3">Tech</h4>
            <div className="space-y-1 text-sm text-[--color-muted] dark:text-[--color-muted-dark]">
              <p>React + Vite</p>
              <p>FastAPI + Supabase</p>
              <p>Gemini API</p>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-[--color-border] dark:border-[--color-border-dark] flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[--color-muted] dark:text-[--color-muted-dark]">
          <p>&copy; {new Date().getFullYear()} RevLens AI. All rights reserved.</p>
          <p>Built with care for homestay owners</p>
        </div>
      </div>
    </footer>
  )
}
