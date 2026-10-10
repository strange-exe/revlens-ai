import { useState, useMemo } from "react"
import { Link } from "react-router-dom"
import ReviewCard from "../components/ReviewCard"
import Toast from "../components/ui/Toast"
import Select from "../components/ui/Select"
import CardSpotlight from "../components/fx/CardSpotlight"
import { MessageSquareText, Building2, Star, TrendingUp, ArrowUpRight, ArrowDownRight, Sparkles, Hash, Activity, ShieldAlert, CalendarDays } from "lucide-react"
import { isSpamReview } from "../services/reviewFilters"
import { PERIODS, aspectInsights, delta, inWindow, periodStats, spamSummary } from "../services/reviewMetrics"
import { useProperty } from "../context/PropertyContext"
import { useAuth } from "../context/AuthContext"
import PageSkeleton from "../components/ui/Skeleton"
import { useDismissibleError } from "../hooks/useDismissibleError"

const accentMap = {
  brand: {
    badge: "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300)",
    icon: "bg-(--color-brand-100) text-(--color-brand-600) dark:bg-(--color-brand-800) dark:text-(--color-brand-300)",
    light: "bg-(--color-brand-50)",
  },
  violet: {
    badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-400",
    icon: "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400",
    light: "bg-violet-50",
  },
  accent: {
    badge: "bg-(--color-accent-500)/10 text-(--color-accent-700) dark:bg-(--color-accent-500)/20 dark:text-(--color-accent-400)",
    icon: "bg-(--color-accent-500)/10 text-(--color-accent-700) dark:bg-(--color-accent-500)/20 dark:text-(--color-accent-400)",
    light: "bg-(--color-accent-500)/5",
  },
  emerald: {
    badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
    light: "bg-emerald-50",
  },
}

// Who flagged a spam review (backend `label_source`), in words a host understands
const SOURCE_NAMES = { model: "AI model", llm: "Gemini", heuristic: "keyword rule", human: "you", sample: "sample data", unknown: "earlier version" }

function formatDelta(value, kind) {
  if (value == null) return null
  const sign = value > 0 ? "+" : ""
  if (kind === "count") return `${sign}${value}`
  if (kind === "rating") return `${sign}${value.toFixed(1)}`
  return `${sign}${Math.round(value * 100)} pts` // rates change in percentage points
}

export default function Dashboard() {
  const { reviews, properties, selectedPropertyId, loading, error } = useProperty()
  const { user } = useAuth()
  const [toastMessage, dismissToast] = useDismissibleError(error)
  const [periodKey, setPeriodKey] = useState("all")
  const period = PERIODS.find((p) => p.key === periodKey)
  // Fixed at page load so the numbers don't shift between renders
  const [now] = useState(() => Date.now())


  const propertyReviews = useMemo(() => (selectedPropertyId === "all"
    ? reviews
    : reviews.filter(r => r.propertyId === parseInt(selectedPropertyId))), [reviews, selectedPropertyId])

  if (loading) return <PageSkeleton label="Loading your dashboard" variant="dashboard" />

  const periodReviews = inWindow(propertyReviews, period.days, now)
  const stats = periodStats(propertyReviews, period, now)
  const { current } = stats
  const insights = aspectInsights(periodReviews)
  const ownIds = new Set(properties.filter((p) => p.userId === user?.id).map((p) => p.id))
  const spam = spamSummary(periodReviews, (r) => !ownIds.has(r.propertyId))

  const comparison = period.days ? `vs previous ${period.days} days` : null
  const ownCount = ownIds.size
  const sampleCount = properties.length - ownCount
  const cards = [
    { label: "Total Reviews", value: current.total, icon: <MessageSquareText size={18} />, accent: "brand",
      change: formatDelta(delta(stats, "total"), "count") },
    // Only the host's own properties: the shared sample properties are noted separately, never counted as theirs
    { label: "Your properties", value: ownCount, note: sampleCount ? `+${sampleCount} sample${sampleCount > 1 ? "s" : ""}` : null,
      icon: <Building2 size={18} />, accent: "violet", change: null },
    { label: "Avg Rating", value: current.avgRating?.toFixed(1) ?? "n/a", icon: <Star size={18} />, accent: "accent",
      change: formatDelta(delta(stats, "avgRating"), "rating") },
    { label: "Positive Rate", value: current.positiveRate == null ? "n/a" : `${Math.round(current.positiveRate * 100)}%`,
      icon: <TrendingUp size={18} />, accent: "emerald", change: formatDelta(delta(stats, "positiveRate"), "rate") },
  ]
  const recent = periodReviews.filter((r) => !isSpamReview(r)).sort((a, b) => b.date.localeCompare(a.date))
  const responsePct = current.responseRate == null ? null : Math.round(current.responseRate * 100)
  const spamSources = Object.entries(spam.bySource).map(([src, n]) => `${SOURCE_NAMES[src] ?? src} (${n})`).join(", ")

  return (
    <>
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={`Error loading dashboard: ${toastMessage}`}
            type="error"
            onClose={dismissToast}
          />
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-ink) dark:text-white">Overview</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Your review performance at a glance</p>
        </div>
        <Select
          value={periodKey}
          onChange={setPeriodKey}
          options={PERIODS.map((p) => ({ value: p.key, label: p.label }))}
          icon={CalendarDays}
          ariaLabel="Time period"
          className="w-full sm:w-48"
        />
      </div>

      {/* Spam notice: says who flagged the reviews instead of assuming "AI" */}
      {spam.count > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 mb-6 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) border-l-4 border-l-amber-500 bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) relative z-10">
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} aria-hidden="true" className="shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-(--color-ink) dark:text-white">{spam.count} {spam.count === 1 ? "review" : "reviews"} flagged as spam</h4>
              <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) mt-0.5">Held back from your stats. Flagged by {spamSources}.</p>
            </div>
          </div>
          <Link
            to="/dashboard/reviews"
            className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) underline underline-offset-4 decoration-(--color-brand-600)/30 hover:decoration-current whitespace-nowrap"
          >
            Review flagged reviews
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-10">
        {cards.map((s) => {
          const a = accentMap[s.accent]
          const down = s.change?.startsWith("-")
          return (
            <CardSpotlight
              key={s.label}
              className="group rounded-2xl widget-card p-4 sm:p-5 hover:-translate-y-1 overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-2.5 rounded-xl ${a.icon} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-[-4deg]`}>
                  {s.icon}
                </div>
                {s.change && (
                  <span title={comparison} className={`inline-flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full ${a.badge} shadow-sm`}>
                    {down ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                    {s.change}
                  </span>
                )}
              </div>
              <p className="font-heading text-2xl sm:text-3xl font-bold text-(--color-ink) dark:text-white leading-none tracking-tight">{s.value}</p>
              <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) mt-1.5 font-medium">
                {s.label}{s.change && comparison ? <span className="opacity-70"> · {comparison}</span> : null}
                {s.note ? <span className="block sm:inline opacity-70"><span className="hidden sm:inline"> · </span>{s.note}</span> : null}
              </p>
            </CardSpotlight>
          )
        })}
      </div>

      {/* Insights: stored AI aspect labels and real reply data */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-10">
        <div className="relative rounded-2xl bg-(--color-ink) dark:bg-white/[0.06] dark:ring-1 dark:ring-white/10 p-6 text-white overflow-hidden">
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-(--color-accent-400)" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/60">AI Insight</p>
            </div>
            <p className="text-sm font-medium leading-relaxed text-white/90">
              {insights.analysed === 0
                ? "No reviews in this period have been analysed by the AI yet."
                : insights.topIssue
                  ? <>Guests criticised <span className="font-bold text-(--color-accent-400)">{insights.topIssue.label}</span> in {insights.topIssue.negative} of {insights.analysed} analysed reviews.</>
                  : <>No recurring complaints across {insights.analysed} analysed reviews.</>}
            </p>
            <p className="text-[10px] text-white/60 mt-3">Based on {insights.analysed} of {current.total} reviews analysed by AI</p>
          </div>
        </div>
        <CardSpotlight className="rounded-2xl widget-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Hash size={14} className="text-(--color-muted) dark:text-(--color-muted-dark)" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Top Theme</p>
          </div>
          {insights.topTheme ? (
            <>
              <p className="font-heading text-xl font-bold text-(--color-ink) dark:text-white tracking-tight">&ldquo;{insights.topTheme.label}&rdquo;</p>
              <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) mt-1.5">
                Mentioned in {insights.topTheme.mentions} of {insights.analysed} analysed reviews · {insights.topTheme.positive} positive, {insights.topTheme.negative} negative
              </p>
            </>
          ) : (
            <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">No themes detected yet.</p>
          )}
        </CardSpotlight>
        <CardSpotlight className="rounded-2xl widget-card p-6">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-(--color-muted) dark:text-(--color-muted-dark)" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Response Rate</p>
          </div>
          <div className="flex items-baseline gap-2.5 mb-3">
            <p className="font-heading text-xl font-bold text-(--color-ink) dark:text-white tracking-tight">{responsePct == null ? "n/a" : `${responsePct}%`}</p>
            <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">{current.replied} of {current.total} replied</span>
          </div>
          <div className="h-2 rounded-full bg-(--color-border) dark:bg-(--color-border-dark) overflow-hidden" role="progressbar" aria-label="Response rate" aria-valuenow={responsePct ?? 0} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-(--color-brand-500)" style={{ width: `${responsePct ?? 0}%` }} />
          </div>
        </CardSpotlight>
      </div>

      {/* Recent Reviews (valid inbox only, newest first) */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-lg font-bold text-(--color-ink) dark:text-white">Recent Reviews</h2>
          <span className="text-xs font-medium text-(--color-muted) dark:text-(--color-muted-dark) bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) px-3 py-1.5 rounded-lg">Latest {Math.min(4, recent.length)} of {recent.length}</span>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) rounded-2xl widget-card p-6 text-center">
            No reviews in this period. Try a longer period above.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {recent.slice(0, 4).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
