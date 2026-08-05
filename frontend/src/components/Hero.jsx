import { useNavigate } from "react-router-dom"
import Button from "./ui/Button"
import { Star, TrendingUp, MessageSquareText, BarChart3 } from "lucide-react"
import Platforms from "./Platforms"

export default function Hero({ title, titleLines, subtitle, ctaText, ctaLink }) {
  const navigate = useNavigate()

  return (
    <section className="relative min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-gradient-to-b from-(--color-brand-50) to-(--color-surface) dark:from-(--color-brand-900)/20 dark:to-(--color-surface-dark) pt-24 pb-6">
      <div className="absolute inset-0 noise-overlay" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-(--color-brand-200)/20 dark:bg-(--color-brand-800)/30 blur-[120px]" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-(--color-accent-500)/10 dark:bg-(--color-accent-500)/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-(--color-brand-400)/5 dark:bg-(--color-brand-600)/8 blur-[160px] animate-pulse-soft" />

        <div className="absolute inset-0 grid-pattern" />

        <svg className="absolute top-32 right-[12%] w-10 h-10 text-(--color-brand-300)/20 dark:text-(--color-brand-600)/25 animate-float-delayed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l2 7h7l-5.5 4 2 7L12 16l-5.5 4 2-7L3 9h7z" />
        </svg>
        <svg className="absolute top-48 left-[6%] w-8 h-8 text-(--color-accent-300)/20 dark:text-(--color-accent-700)/20 animate-float" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <circle cx="12" cy="12" r="10" />
          <circle cx="12" cy="12" r="4" />
        </svg>

        <div className="absolute top-[20%] right-[25%] w-px h-40 bg-gradient-to-b from-(--color-brand-300)/20 to-transparent dark:from-(--color-brand-600)/20" />
        <div className="absolute bottom-[30%] right-[30%] w-px h-28 bg-gradient-to-t from-(--color-accent-300)/15 to-transparent dark:from-(--color-accent-700)/15" />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 flex items-center">
        <div className="flex flex-col lg:flex-row lg:items-center lg:gap-16 w-full">
          {/* Left: Copy */}
          <div className="flex-1 max-w-2xl">
            <div className="animate-slide-up-sm inline-flex items-center gap-2.5 px-4 py-2 rounded-full glass text-xs font-semibold tracking-wide text-(--color-brand-500) dark:text-(--color-brand-300) mb-8">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-(--color-brand-400) animate-ping opacity-40" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-(--color-brand-500) dark:bg-(--color-brand-400)" />
              </span>
              AI-Powered Review Intelligence
            </div>

            <h1 className="animate-slide-up font-heading text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.9] text-(--color-brand-600) dark:text-white">
              {Array.isArray(titleLines)
                ? titleLines.map((line, i) => (
                    <span key={line}>
                      {line}
                      {i < titleLines.length - 1 && <br />}
                    </span>
                  ))
                : title}
            </h1>

            <p className="animate-slide-up mt-6 text-base sm:text-lg text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-xl delay-2">
              {subtitle}
            </p>

            <div className="animate-slide-up mt-10 flex flex-col sm:flex-row gap-3.5 delay-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => navigate(ctaLink)}
                icon={<svg className="relative z-10 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
                iconPosition="right"
                className="group relative overflow-hidden shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <span className="relative z-10">{ctaText}</span>
              </Button>
              <a
                href="https://github.com/strange-exe/revlens-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl glass text-sm font-medium text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-50) dark:hover:bg-white/10 dark:hover:text-white transition-all duration-300 hover:-translate-y-0.5 cursor-pointer w-full sm:w-auto shadow-xl"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
                Browse Source
              </a>
            </div>
          </div>

          {/* Right: Mock Dashboard Preview */}
          <div className="hidden lg:block flex-1 max-w-md animate-fade-in delay-4">
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-(--color-brand-400)/20 via-(--color-accent-400)/10 to-(--color-brand-600)/20 blur-2xl animate-pulse-soft" />

              <div className="relative rounded-2xl overflow-hidden border border-(--color-border) dark:border-(--color-border-dark) bg-white/90 dark:bg-(--color-surface-elevated-dark)/90 backdrop-blur-xl shadow-2xl">
                {/* Mini Header */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-(--color-brand-400)/80" />
                  </div>
                  <span className="ml-2 text-[10px] font-medium text-(--color-muted) dark:text-(--color-muted-dark)">RevLens Dashboard</span>
                </div>

                <div className="p-5 space-y-4">
                  {/* Mini Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { icon: <MessageSquareText size={14} />, label: "Reviews", value: "248", color: "text-(--color-brand-500)" },
                      { icon: <Star size={14} />, label: "Rating", value: "4.8", color: "text-amber-400" },
                      { icon: <TrendingUp size={14} />, label: "Growth", value: "+23%", color: "text-emerald-500" },
                      { icon: <BarChart3 size={14} />, label: "Score", value: "93%", color: "text-violet-500" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) p-3 transition-all hover:scale-[1.02]">
                        <div className={`${s.color} mb-1`}>{s.icon}</div>
                        <p className="font-heading text-xl font-bold text-(--color-brand-600) dark:text-white leading-none">{s.value}</p>
                        <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-0.5">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Mini Chart Bars */}
                  <div className="rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-(--color-brand-600) dark:text-white uppercase tracking-wider">Sentiment</span>
                      <span className="text-[9px] text-(--color-muted) dark:text-(--color-muted-dark)">This week</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "Positive", w: "78%", color: "bg-(--color-brand-400)" },
                        { label: "Neutral", w: "15%", color: "bg-(--color-accent-400)" },
                        { label: "Negative", w: "7%", color: "bg-red-400" },
                      ].map((b) => (
                        <div key={b.label} className="flex items-center gap-2">
                          <span className="text-[9px] text-(--color-muted) dark:text-(--color-muted-dark) w-12 shrink-0">{b.label}</span>
                          <div className="flex-1 h-2 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden">
                            <div className={`h-full rounded-full ${b.color} transition-all duration-1000`} style={{ width: b.w }} />
                          </div>
                          <span className="text-[9px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) w-7 text-right">{b.w}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Mini Review */}
                  <div className="rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) p-3 flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) flex items-center justify-center text-[10px] font-bold text-white shrink-0">P</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-(--color-brand-600) dark:text-white">Priya S.</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-(--color-brand-100) text-(--color-brand-600) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) font-semibold">positive</span>
                      </div>
                      <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-1 leading-relaxed line-clamp-2">
                        Absolutely stunning property! The view was breathtaking...
                      </p>
                      <div className="flex items-center gap-0.5 mt-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={9} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Platforms nested={true} />
    </section>
  )
}
