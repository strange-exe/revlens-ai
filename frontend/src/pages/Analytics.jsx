import { useMemo, useState, useEffect } from "react"
import { useProperty } from "../context/PropertyContext"
import { BarChart3, PieChart, TrendingUp, AlertCircle, Star } from "lucide-react"
import { Loader, Toast } from "../components/ui"
import { detectSpam } from "../data/spamFilter"

export default function Analytics() {
  const { reviews, selectedPropertyId, loading, error } = useProperty()
  const [toastMessage, setToastMessage] = useState(null)

  useEffect(() => {
    if (error) {
      setToastMessage(error)
    }
  }, [error])

  // Filter reviews by selected property and exclude spam
  const filteredReviews = useMemo(() => {
    const propReviews = selectedPropertyId === "all"
      ? reviews
      : reviews.filter((r) => r.propertyId === parseInt(selectedPropertyId))
    
    // Exclude spam reviews from analytics calculations
    return propReviews.filter((r) => !detectSpam(r.text, r.guestName).isSpam)
  }, [reviews, selectedPropertyId])

  // Dynamic calculations
  const total = filteredReviews.length
  const positive = filteredReviews.filter((r) => r.sentiment === "positive").length
  const neutral = filteredReviews.filter((r) => r.sentiment === "neutral").length
  const negative = filteredReviews.filter((r) => r.sentiment === "negative").length

  const avgRating = useMemo(() => {
    if (total === 0) return "0.0"
    return (filteredReviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1)
  }, [filteredReviews, total])

  const sentimentBars = useMemo(() => {
    if (total === 0) {
      return [
        { label: "Positive", count: 0, color: "bg-(--color-brand-400)", gradient: "from-(--color-brand-400) to-(--color-brand-500)", pct: 0, textColor: "text-(--color-brand-500) dark:text-(--color-brand-300)" },
        { label: "Neutral", count: 0, color: "bg-(--color-accent-400)", gradient: "from-(--color-accent-400) to-(--color-accent-500)", pct: 0, textColor: "text-(--color-accent-500) dark:text-(--color-accent-400)" },
        { label: "Negative", count: 0, color: "bg-red-400", gradient: "from-red-400 to-red-500", pct: 0, textColor: "text-red-500 dark:text-red-400" },
      ]
    }
    return [
      { label: "Positive", count: positive, color: "bg-(--color-brand-400)", gradient: "from-(--color-brand-400) to-(--color-brand-500)", pct: Math.round((positive / total) * 100), textColor: "text-(--color-brand-500) dark:text-(--color-brand-300)" },
      { label: "Neutral", count: neutral, color: "bg-(--color-accent-400)", gradient: "from-(--color-accent-400) to-(--color-accent-500)", pct: Math.round((neutral / total) * 100), textColor: "text-(--color-accent-500) dark:text-(--color-accent-400)" },
      { label: "Negative", count: negative, color: "bg-red-400", gradient: "from-red-400 to-red-500", pct: Math.round((negative / total) * 100), textColor: "text-red-500 dark:text-red-400" },
    ]
  }, [positive, neutral, negative, total])

  // Extract themes dynamically based on actual reviews
  const themes = useMemo(() => {
    const baseThemes = [
      { name: "Cleanliness", mentions: 0, sentiment: "positive" },
      { name: "Location", mentions: 0, sentiment: "positive" },
      { name: "WiFi Speed", mentions: 0, sentiment: "negative" },
      { name: "Staff Friendliness", mentions: 0, sentiment: "positive" },
      { name: "Value for Money", mentions: 0, sentiment: "neutral" },
    ]

    filteredReviews.forEach((r) => {
      const text = r.text.toLowerCase()
      if (text.includes("clean") || text.includes("spotless") || text.includes("tidy")) {
        baseThemes[0].mentions++
      }
      if (text.includes("location") || text.includes("view") || text.includes("scenery") || text.includes("beach") || text.includes("lake")) {
        baseThemes[1].mentions++
      }
      if (text.includes("wifi") || text.includes("internet") || text.includes("speed") || text.includes("connection")) {
        baseThemes[2].mentions++
      }
      if (text.includes("staff") || text.includes("host") || text.includes("helper") || text.includes("service")) {
        baseThemes[3].mentions++
      }
      if (text.includes("value") || text.includes("price") || text.includes("worth") || text.includes("expensive") || text.includes("overpriced")) {
        baseThemes[4].mentions++
      }
    })

    return baseThemes
  }, [filteredReviews])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Aggregating property metrics..." />
      </div>
    )
  }

  return (
    <>
      {/* Toast Alert Portal */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={`Error loading analytics: ${toastMessage}`}
            type="error"
            onClose={() => setToastMessage(null)}
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Analytics</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Sentiment and rating breakdowns</p>
        </div>
        <span className="text-xs font-semibold text-(--color-brand-600) dark:text-brand-300 bg-(--color-brand-100) dark:bg-(--color-brand-800) px-3.5 py-1.5 rounded-lg border border-(--color-brand-200) dark:border-(--color-brand-700) shadow-sm w-fit">
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
                {total > 0 && (
                  <>
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${(positive / total) * 88} ${88 - (positive / total) * 88}`} strokeDashoffset="0" className="text-(--color-brand-400) transition-all duration-1000" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${(neutral / total) * 88} ${88 - (neutral / total) * 88}`} strokeDashoffset={`${-((positive / total) * 88)}`} className="text-(--color-accent-400) transition-all duration-1000" strokeLinecap="round" />
                    <circle cx="18" cy="18" r="14" fill="none" strokeWidth="3" strokeDasharray={`${(negative / total) * 88} ${88 - (negative / total) * 88}`} strokeDashoffset={`${-(((positive + neutral) / total) * 88)}`} className="text-red-400 transition-all duration-1000" strokeLinecap="round" />
                  </>
                )}
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
            <div className="p-2 rounded-xl bg-(--color-accent-500)/10 dark:bg-(--color-accent-500)/20 shadow-sm">
              <BarChart3 size={16} className="text-(--color-accent-600) dark:text-(--color-accent-400)" />
            </div>
            <div>
              <h2 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">Rating Breakdown</h2>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">{total} total reviews</p>
            </div>
          </div>

          <div className="flex items-center gap-5 mb-6 p-4 rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) border border-(--color-border) dark:border-(--color-border-dark)">
            <span className="font-heading text-4xl font-bold text-(--color-brand-600) dark:text-white">
              {avgRating}
            </span>
            <div className="h-10 w-px bg-(--color-border) dark:bg-(--color-border-dark)" />
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star
                    key={s}
                    size={14}
                    className={`${s <= Math.round(parseFloat(avgRating)) ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-(--color-border-dark)"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-0.5">Average from {total} reviews</p>
            </div>
          </div>

          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = filteredReviews.filter((r) => r.rating === star).length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={star}>
                  <div className="flex justify-between text-xs mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-(--color-brand-600) dark:text-white">{star}</span>
                      <Star size={11} className="fill-amber-400 text-amber-400" />
                    </div>
                    <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-(--color-brand-400) to-(--color-brand-500) transition-all duration-1000 ease-out shadow-sm"
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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {themes.map((t) => (
            <div key={t.name} className="group rounded-xl widget-card p-4 hover:-translate-y-1 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-full ${
                  t.sentiment === "positive" ? "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) ring-1 ring-(--color-brand-300)/20 dark:ring-(--color-brand-700)/50"
                  : t.sentiment === "negative" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-300/20 dark:ring-red-800/30"
                  : "bg-(--color-silver-100) text-(--color-silver-700) dark:bg-(--color-silver-800)/40 dark:text-(--color-silver-300) ring-1 ring-(--color-silver-200) dark:ring-(--color-silver-800)/50"
                }`}>
                  {t.sentiment}
                </span>
                {t.sentiment === "negative" && t.mentions > 0 && <AlertCircle size={12} className="text-red-400 animate-pulse-soft" />}
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
