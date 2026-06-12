import { mockReviews, properties } from "../data/mockReviews"
import ReviewCard from "../components/ReviewCard"
import { MessageSquareText, Building2, Star, TrendingUp, ArrowUpRight, Sparkles, Hash, Activity } from "lucide-react"

const stats = [
  {
    label: "Total Reviews",
    value: mockReviews.length,
    icon: <MessageSquareText size={18} />,
    accent: "brand",
    change: "+12%",
  },
  {
    label: "Properties",
    value: properties.length,
    icon: <Building2 size={18} />,
    accent: "violet",
    change: "+1",
  },
  {
    label: "Avg Rating",
    value: (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1),
    icon: <Star size={18} />,
    accent: "gold",
    change: "+0.3",
  },
  {
    label: "Positive Rate",
    value: `${Math.round((mockReviews.filter((r) => r.sentiment === "positive").length / mockReviews.length) * 100)}%`,
    icon: <TrendingUp size={18} />,
    accent: "emerald",
    change: "+5%",
  },
]

const accentMap = {
  brand: {
    gradient: "from-(--color-brand-400) to-(--color-brand-600)",
    badge: "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300)",
    icon: "bg-(--color-brand-100) text-(--color-brand-600) dark:bg-(--color-brand-800) dark:text-(--color-brand-300)",
    light: "bg-(--color-brand-50)",
  },
  violet: {
    gradient: "from-violet-400 to-violet-600",
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    light: "bg-violet-50",
  },
  gold: {
    gradient: "from-(--color-gold-400) to-(--color-gold-600)",
    badge: "bg-(--color-gold-100) text-(--color-gold-700) dark:bg-(--color-gold-900)/40 dark:text-(--color-gold-400)",
    icon: "bg-(--color-gold-100) text-(--color-gold-600) dark:bg-(--color-gold-900)/40 dark:text-(--color-gold-400)",
    light: "bg-(--color-gold-50)",
  },
  emerald: {
    gradient: "from-emerald-400 to-emerald-600",
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    icon: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    light: "bg-emerald-50",
  },
}

export default function Dashboard() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Overview</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Your review performance at a glance</p>
        </div>
        <span className="text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) bg-(--color-brand-100) dark:bg-(--color-brand-800) px-3.5 py-1.5 rounded-lg border border-(--color-brand-200) dark:border-(--color-brand-700) shadow-sm">
          Last 30 days
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => {
          const a = accentMap[s.accent]
          return (
            <div
              key={s.label}
              className="group relative rounded-2xl widget-card p-5 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${a.gradient} opacity-70 group-hover:opacity-100 transition-opacity`} />
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${a.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}>
                  {s.icon}
                </div>
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${a.badge} shadow-sm`}>
                  <ArrowUpRight size={10} />
                  {s.change}
                </span>
              </div>
              <p className="font-heading text-3xl font-bold text-(--color-brand-600) dark:text-white leading-none tracking-tight">{s.value}</p>
              <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) mt-1.5 font-medium">{s.label}</p>
            </div>
          )
        })}
      </div>

      {/* Quick Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="relative rounded-2xl bg-gradient-to-br from-(--color-brand-600) to-(--color-brand-900) p-6 text-white overflow-hidden shadow-xl shadow-black/15">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-(--color-gold-400)/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-(--color-gold-300)" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/50">AI Insight</p>
            </div>
            <p className="text-sm font-medium leading-relaxed text-white/85">
              Your <span className="font-bold text-(--color-gold-300)">WiFi speed</span> was mentioned in 4 recent reviews. Consider upgrading your internet plan.
            </p>
          </div>
        </div>
        <div className="rounded-2xl widget-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={14} className="text-(--color-muted) dark:text-(--color-muted-dark)" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Top Theme</p>
          </div>
          <p className="font-heading text-xl font-bold text-(--color-brand-600) dark:text-white tracking-tight">&ldquo;Cleanliness&rdquo;</p>
          <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) mt-1.5">Mentioned in 68% of positive reviews</p>
        </div>
        <div className="rounded-2xl widget-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-(--color-muted) dark:text-(--color-muted-dark)" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Response Rate</p>
          </div>
          <div className="flex items-baseline gap-2.5 mb-3">
            <p className="font-heading text-xl font-bold text-(--color-brand-600) dark:text-white tracking-tight">72%</p>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">+8% this week</span>
          </div>
          <div className="h-2 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-(--color-brand-400) to-(--color-brand-500) w-[72%] shadow-sm shadow-(--color-brand-400)/20" />
          </div>
        </div>
      </div>

      {/* Recent Reviews */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-(--color-brand-600) dark:text-white">Recent Reviews</h2>
          <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark) bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) px-3 py-1.5 rounded-lg">Latest 4 of {mockReviews.length}</span>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {mockReviews.slice(0, 4).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </>
  )
}
