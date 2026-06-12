import { Link } from "react-router-dom"

export default function Hero({ title, subtitle, ctaText, ctaLink }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[--color-brand-50] to-[--color-surface] dark:from-[--color-brand-900] dark:to-[--color-surface-dark]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-[--color-brand-200]/30 dark:bg-[--color-brand-700]/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full bg-[--color-gold-200]/20 dark:bg-[--color-gold-900]/20 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%)] dark:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.01)_50%,transparent_75%)]" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-36">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-[--color-brand-200] dark:border-[--color-brand-700] text-xs font-medium text-[--color-brand-500] dark:text-[--color-brand-300] bg-white/50 dark:bg-[--color-surface-elevated-dark]/50 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-brand-500] dark:bg-[--color-brand-400] animate-pulse" />
            AI-powered review intelligence
          </div>
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] text-[--color-brand-600] dark:text-white">
            {title}
          </h1>
          <p className="mt-5 text-base sm:text-lg text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed max-w-2xl">
            {subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={ctaLink}
              className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[--color-brand-500] text-white text-sm font-semibold hover:bg-[--color-brand-600] transition-colors shadow-sm"
            >
              {ctaText}
              <svg className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-5 py-2.5 rounded-lg border border-[--color-border] dark:border-[--color-border-dark] text-sm font-medium text-[--color-muted] dark:text-[--color-muted-dark] hover:bg-white dark:hover:bg-[--color-surface-elevated-dark] transition-colors"
            >
              <svg className="mr-2 w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              Browse Source
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
