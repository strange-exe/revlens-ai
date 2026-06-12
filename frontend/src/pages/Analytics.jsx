import { mockReviews } from "../data/mockReviews"
import { BarChart3, PieChart, TrendingUp, AlertCircle, Star } from "lucide-react"

const positive = mockReviews.filter((r) => r.sentiment === "positive").length
const neutral = mockReviews.filter((r) => r.sentiment === "neutral").length
const negative = mockReviews.filter((r) => r.sentiment === "negative").length
const total = mockReviews.length

const sentimentBars = [
  { label: "Positive", count: positive, color: "bg-(--color-brand-400)", gradient: "from-(--color-brand-400) to-(--color-brand-500)", pct: Math.round((positive / total) * 100), textColor: "text-(--color-brand-500) dark:text-(--color-brand-300)" },
  { label: "Neutral", count: neutral, color: "bg-(--color-gold-400)", gradient: "from-(--color-gold-400) to-(--color-gold-500)", pct: Math.round((neutral / total) * 100), textColor: "text-(--color-gold-500) dark:text-(--color-gold-400)" },
  { label: "Negative", count: negative, color: "bg-red-400", gradient: "from-red-400 to-red-500", pct: Math.round((negative / total) * 100), textColor: "text-red-500 dark:text-red-400" },
]

const themes = [
  { name: "Cleanliness", mentions: 7, sentiment: "positive" },
  { name: "Location", mentions: 6, sentiment: "positive" },
  { name: "WiFi Speed", mentions: 4, sentiment: "negative" },
  { name: "Staff Friendliness", mentions: 5, sentiment: "positive" },
  { name: "Value for Money", mentions: 3, sentiment: "neutral" },
]

export default function Analytics() {
  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Analytics</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Sentiment and rating breakdowns</p>
        </div>
        <span className="text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) bg-(--color-brand-100) dark:bg-(--color-brand-800) px-3.5 py-1.5 rounded-lg border border-(--color-brand-200) dark:border-(--color-brand-700) shadow-sm">
          {total} reviews analyzed
        </span>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {sentimentBars.map((b) => (
          <div key={b.label} className="rounded-2xl widget-card p-5 relative overflow-hidden">
            <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${b.gradient} opacity-80`} />
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark) mb-1.5">{b.label}</p>
            <div className="flex items-baseline gap-2">
              <span className={`font-heading text-3xl font-bold ${b.textColor}`}>{b.pct}%</span>
              <span className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">{b.count} reviews</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        {/* Sentiment Distribution */}
        <div className="rounded-2xl widget-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-(--color-brand-100) dark:bg-(--color-brand-800) shadow-sm">
              <PieChart size={16} className="text-(--color-brand-600) dark:text-(--color-brand-300)" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">Sentiment Distribution</h2>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">{total} total reviews</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 mb-6">
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 drop-shadow-sm">
                <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-(--color-border) dark:text-(--color-border-dark)" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${positive / total * 88} ${88 - positive / total * 88}`} strokeDashoffset="0" className="text-(--color-brand-400) transition-all duration-1000" strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${neutral / total * 88} ${88 - neutral / total * 88}`} strokeDashoffset={`${-(positive / total * 88)}`} className="text-(--color-gold-400) transition-all duration-1000" strokeLinecap="round" />
                <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${negative / total * 88} ${88 - negative / total * 88}`} strokeDashoffset={`${-((positive + neutral) / total * 88)}`} className="text-red-400 transition-all duration-1000" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-heading text-xl font-bold text-(--color-brand-600) dark:text-white">{total}</span>
                <span className="text-[9px] text-(--color-muted) dark:text-(--color-muted-dark)">total</span>
              </div>
            </div>
            <div className="space-y-2.5 w-full sm:flex-1">
              {sentimentBars.map((b) => (
                <div key={b.label} className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${b.color} shrink-0 ring-1 ring-inset ring-black/10 dark:ring-white/10`} />
                  <span className="text-xs font-semibold text-(--color-brand-600) dark:text-white flex-1">{b.label}</span>
                  <span className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) font-medium">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {sentimentBars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-2">
                  <span className="font-semibold text-(--color-brand-600) dark:text-white">{b.label}</span>
                  <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{b.count} &middot; {b.pct}%</span>
                </div>
                <div className="h-2.5 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${b.gradient} transition-all duration-1000 ease-out shadow-sm`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="rounded-2xl widget-card p-6 lg:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-(--color-gold-100) dark:bg-(--color-gold-900)/40 shadow-sm">
              <BarChart3 size={16} className="text-(--color-gold-600) dark:text-(--color-gold-400)" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">Rating Breakdown</h2>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">{total} total reviews</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-6 p-4 rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) border border-(--color-border) dark:border-(--color-border-dark)">
            <span className="font-heading text-4xl font-bold text-(--color-brand-600) dark:text-white">
              {(mockReviews.reduce((s, r) => s + r.rating, 0) / total).toFixed(1)}
            </span>
            <div className="h-10 w-px bg-(--color-border) dark:bg-(--color-border-dark)" />
            <div>
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={`${s <= Math.round(mockReviews.reduce((acc, r) => acc + r.rating, 0) / total) ? "fill-(--color-gold-400) text-(--color-gold-400)" : "text-(--color-border) dark:text-(--color-border-dark)"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-0.5">Average from {total} reviews</p>
            </div>
          </div>

          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = mockReviews.filter((r) => r.rating === star).length
              const pct = Math.round((count / total) * 100)
              return (
                <div key={star}>
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-(--color-brand-600) dark:text-white">{star}</span>
                      <Star size={11} className="fill-(--color-gold-400) text-(--color-gold-400)" />
                    </div>
                    <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-(--color-gold-400) to-(--color-gold-500) transition-all duration-1000 ease-out shadow-sm"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Detected Themes */}
      <div className="rounded-2xl widget-card p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-900/40 shadow-sm">
            <TrendingUp size={16} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">Detected Themes</h2>
            <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">AI-extracted topics from your reviews</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {themes.map((t) => (
            <div key={t.name} className="group rounded-xl widget-card p-4 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                  t.sentiment === "positive" ? "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) ring-1 ring-(--color-brand-300)/20 dark:ring-(--color-brand-700)/50"
                  : t.sentiment === "negative" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-300/20 dark:ring-red-800/30"
                  : "bg-(--color-gold-100) text-(--color-gold-700) dark:bg-(--color-gold-900)/40 dark:text-(--color-gold-400) ring-1 ring-(--color-gold-300)/20 dark:ring-(--color-gold-800)/30"
                }`}>
                  {t.sentiment}
                </span>
                {t.sentiment === "negative" && <AlertCircle size={12} className="text-red-400" />}
              </div>
              <p className="font-heading text-sm font-bold text-(--color-brand-600) dark:text-white">{t.name}</p>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-0.5">{t.mentions} mentions</p>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
