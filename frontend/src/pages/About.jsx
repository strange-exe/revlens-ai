import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui"
import useScrollReveal from "../hooks/useScrollReveal"
import { ArrowUpRight, Lightbulb, Target, Heart, Code2, Rocket } from "lucide-react"

const values = [
  {
    icon: <Lightbulb size={20} />,
    title: "Innovation First",
    desc: "We push the boundaries of what AI can do for hospitality, turning raw feedback into strategic advantage.",
  },
  {
    icon: <Target size={20} />,
    title: "Owner-Centric",
    desc: "Every feature is designed around the daily workflow of real homestay operators - no enterprise bloat.",
  },
  {
    icon: <Heart size={20} />,
    title: "Hospitality at Heart",
    desc: "We believe technology should enhance the human touch, not replace it. Better insights, warmer interactions.",
  },
]

const timeline = [
  { phase: "Week 1", title: "Project Planning & Repository Setup", status: "done" },
  { phase: "Week 2", title: "Frontend Skeleton & UI Components", status: "done" },
  { phase: "Week 3", title: "Backend API & Database Setup", status: "done" },
  { phase: "Week 4", title: "AI Integration with Gemini API", status: "done" },
  { phase: "Week 5", title: "Dashboard Analytics & Charts", status: "current" },
  { phase: "Week 6", title: "Testing, Polish & Production", status: "upcoming" },
]

export default function About() {
  const containerRef = useScrollReveal()
  const navigate = useNavigate()

  return (
    <div ref={containerRef}>
      {/* Hero */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-gradient-to-b from-(--color-brand-50) to-(--color-surface) dark:from-(--color-brand-900)/20 dark:to-(--color-surface-dark) pt-32 pb-20">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-(--color-brand-100)/10 dark:bg-(--color-brand-900)/10 blur-[100px]" />

        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6">
          <span className="reveal font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">About</span>
          <h1 className="reveal font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
            RevLens AI
          </h1>
          <div className="reveal amethyst-divider mt-6 mb-8" />
          <div className="reveal space-y-5 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-2xl">
            <p>
              RevLens AI helps homestay owners analyze guest reviews, classify sentiment, identify recurring themes, and
              generate actionable insights through AI-powered analytics and visual dashboards.
            </p>
            <p>
              The platform centralizes feedback from multiple review sources and transforms unstructured reviews into
              meaningful business intelligence. Using Google's Gemini API, RevLens AI can automatically classify sentiment,
              detect key themes, suggest professional responses, and visualize trends through an interactive analytics dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* Mission / Values */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
              Our Mission
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
              Empowering homestay owners<br />with AI-driven insights
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div
                key={v.title}
                className="reveal group rounded-2xl widget-card p-7 hover:-translate-y-0.5 flex flex-col h-full"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className="p-3 rounded-xl w-fit bg-(--color-brand-50) dark:bg-(--color-brand-800) text-(--color-brand-500) dark:text-(--color-brand-300) mb-4 transition-transform duration-300 group-hover:scale-105">
                  {v.icon}
                </div>
                <h3 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">{v.title}</h3>
                <p className="mt-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed flex-1">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack & Features Cards */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark)">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
              Under The Hood
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-(--color-brand-600) dark:text-white mt-3">
              Tech Stack & Features
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="reveal rounded-2xl widget-card p-7 flex flex-col h-full">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-(--color-brand-50) dark:bg-(--color-brand-800)">
                  <Code2 size={16} className="text-(--color-brand-500) dark:text-(--color-brand-300)" />
                </div>
                <h3 className="font-heading text-sm font-bold text-(--color-brand-600) dark:text-white uppercase tracking-wide">Tech Stack</h3>
              </div>
              <div className="amethyst-divider mb-5" />
              <ul className="space-y-4 flex-1">
                {[
                  ["React + Vite", "Frontend framework"],
                  ["Tailwind CSS v4", "Styling"],
                  ["FastAPI", "Backend API"],
                  ["PostgreSQL", "Database"],
                ].map(([item, desc]) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-brand-400) mt-1.5 shrink-0" />
                    <div>
                      <span className="font-semibold text-(--color-brand-600) dark:text-white">{item}</span>
                      <span className="text-(--color-muted) dark:text-(--color-muted-dark)"> — {desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="reveal rounded-2xl widget-card p-7 flex flex-col h-full">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-(--color-accent-500)/10 dark:bg-(--color-accent-500)/20">
                  <Rocket size={16} className="text-(--color-accent-600) dark:text-(--color-accent-400)" />
                </div>
                <h3 className="font-heading text-sm font-bold text-(--color-brand-600) dark:text-white uppercase tracking-wide">Features</h3>
              </div>
              <div className="amethyst-divider mb-5" />
              <ul className="space-y-4 flex-1">
                {[
                  "Sentiment analysis",
                  "Theme detection",
                  "AI-generated responses",
                  "Analytics dashboard",
                  "Trend tracking",
                  "Bulk review processing",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-(--color-accent-400) shrink-0" />
                    <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap Timeline */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
              Roadmap
            </span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-(--color-brand-600) dark:text-white mt-3">
              Development Timeline
            </h2>
          </div>
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 sm:left-5 top-0 bottom-0 w-px bg-gradient-to-b from-(--color-brand-400) via-(--color-brand-200) to-transparent dark:from-(--color-brand-500) dark:via-(--color-brand-700)" />

            <div className="space-y-6">
              {timeline.map((t, i) => (
                <div key={t.phase} className="reveal relative pl-12 sm:pl-14" style={{ transitionDelay: `${i * 0.08}s` }}>
                  {/* Dot */}
                  <div className={`absolute left-2.5 sm:left-3.5 top-1 w-3 h-3 rounded-full border-2 transition-all
                    ${t.status === "done"
                      ? "bg-(--color-brand-400) border-(--color-brand-400) shadow-[0_0_8px_rgba(139,92,246,0.4)]"
                      : t.status === "current"
                        ? "bg-(--color-accent-400) border-(--color-accent-400) shadow-[0_0_8px_rgba(6,182,212,0.4)] animate-pulse-soft"
                        : "bg-transparent border-(--color-border) dark:border-(--color-border-dark)"
                    }`}
                  />
                  <div className={`rounded-xl p-4 transition-all ${
                    t.status === "current"
                      ? "bg-(--color-brand-50) dark:bg-(--color-brand-900)/30 border border-(--color-brand-200) dark:border-(--color-brand-700)"
                      : "widget-card border-(--color-border)/60 dark:border-(--color-border-dark)/60"
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        t.status === "done"
                          ? "bg-(--color-brand-100) text-(--color-brand-600) dark:bg-(--color-brand-800) dark:text-(--color-brand-300)"
                          : t.status === "current"
                            ? "bg-(--color-accent-500)/10 text-(--color-accent-600) dark:bg-(--color-accent-500)/20 dark:text-(--color-accent-400)"
                            : "bg-(--color-surface-muted) text-(--color-muted) dark:bg-(--color-surface-muted-dark) dark:text-(--color-muted-dark)"
                      }`}>
                        {t.phase}
                      </span>
                      {t.status === "current" && (
                        <span className="text-[10px] font-bold text-(--color-accent-500) dark:text-(--color-accent-400) uppercase tracking-wider">In Progress</span>
                      )}
                      {t.status === "done" && (
                        <span className="text-[10px] font-bold text-(--color-brand-500) dark:text-(--color-brand-300) uppercase tracking-wider">Completed</span>
                      )}
                    </div>
                    <h3 className="font-heading text-sm font-bold text-(--color-brand-600) dark:text-white mt-2">{t.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-(--color-brand-600) to-(--color-brand-800) dark:from-(--color-brand-900) dark:to-black" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 py-20 lg:py-24 text-center">
          <h2 className="reveal font-heading text-3xl sm:text-4xl font-bold text-white leading-tight">
            Want to contribute?
          </h2>
          <p className="reveal mt-3 text-sm text-white/60 max-w-md mx-auto">
            RevLens AI is open source. Check out the repo, raise issues, or submit pull requests.
          </p>
          <div className="reveal mt-8 flex flex-col sm:flex-row justify-center gap-3.5 items-stretch sm:items-center">
            <Button
              variant="custom"
              icon={<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>}
              onClick={() => window.open('https://github.com/strange-exe/revlens-ai', '_blank', 'noopener,noreferrer')}
              className="group bg-white text-(--color-brand-600) hover:bg-(--color-brand-50) shadow-xl hover:shadow-2xl hover:-translate-y-0.5 w-full sm:w-auto"
            >
              View on GitHub
            </Button>
            <Button
              variant="custom"
              onClick={() => navigate("/dashboard")}
              className="border border-white/30 text-white bg-transparent hover:bg-white/10 dark:bg-transparent dark:hover:bg-white/10 w-full sm:w-auto"
            >
              Try Dashboard
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
