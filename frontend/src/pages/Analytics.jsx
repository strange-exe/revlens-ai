import { useMemo } from "react"
import { useProperty } from "../context/PropertyContext"
import PageSkeleton from "../components/ui/Skeleton"
import { useDismissibleError } from "../hooks/useDismissibleError"
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  AlertCircle, 
  Star, 
  Sparkles, 
  Wifi, 
  MapPin, 
  User, 
  DollarSign, 
  BedDouble,
  ShieldCheck, 
  MessageSquare,
  ArrowUpRight,
  ArrowDownRight,
  TrendingDown,
  Info
} from "lucide-react"
import Toast from "../components/ui/Toast"
import { isSpamReview } from "../services/reviewFilters"

export default function Analytics() {
  const { reviews, selectedPropertyId, loading, error } = useProperty()
  const [toastMessage, dismissToast] = useDismissibleError(error)


  // Filter reviews by selected property and exclude spam
  const filteredReviews = useMemo(() => {
    const propReviews = selectedPropertyId === "all"
      ? reviews
      : reviews.filter((r) => r.propertyId === parseInt(selectedPropertyId))
    
    // Exclude spam reviews from analytics calculations
    return propReviews.filter((r) => !isSpamReview(r))
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
        { label: "Positive", count: 0, color: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600", pct: 0, textColor: "text-emerald-500 dark:text-emerald-400" },
        { label: "Neutral", count: 0, color: "bg-amber-500", gradient: "from-amber-400 to-amber-600", pct: 0, textColor: "text-amber-500 dark:text-amber-400" },
        { label: "Negative", count: 0, color: "bg-rose-500", gradient: "from-rose-400 to-rose-600", pct: 0, textColor: "text-rose-500 dark:text-rose-400" },
      ]
    }
    return [
      { label: "Positive", count: positive, color: "bg-emerald-500", gradient: "from-emerald-400 to-emerald-600", pct: Math.round((positive / total) * 100), textColor: "text-emerald-500 dark:text-emerald-400" },
      { label: "Neutral", count: neutral, color: "bg-amber-500", gradient: "from-amber-400 to-amber-600", pct: Math.round((neutral / total) * 100), textColor: "text-amber-500 dark:text-amber-400" },
      { label: "Negative", count: negative, color: "bg-rose-500", gradient: "from-rose-400 to-rose-600", pct: Math.round((negative / total) * 100), textColor: "text-rose-500 dark:text-rose-400" },
    ]
  }, [positive, neutral, negative, total])

  // Aggregate the backend's per-review aspect labels (aspects = null means the AI hasn't analysed that review)
  const analysedReviews = useMemo(() => filteredReviews.filter((r) => r.aspects), [filteredReviews])

  const themes = useMemo(() => {
    const baseThemes = [
      { key: "cleanliness", name: "Cleanliness", icon: ShieldCheck, colorClass: "text-emerald-500 bg-emerald-500/10" },
      { key: "location", name: "Location & Views", icon: MapPin, colorClass: "text-sky-500 bg-sky-500/10" },
      { key: "wifi", name: "WiFi & Internet", icon: Wifi, colorClass: "text-rose-500 bg-rose-500/10" },
      { key: "host", name: "Host Hospitality", icon: User, colorClass: "text-violet-500 bg-violet-500/10" },
      { key: "value", name: "Value for Money", icon: DollarSign, colorClass: "text-amber-500 bg-amber-500/10" },
      { key: "amenities", name: "Rooms & Amenities", icon: BedDouble, colorClass: "text-teal-500 bg-teal-500/10" },
    ]
    return baseThemes.map((t) => {
      const labels = analysedReviews.map((r) => r.aspects[t.key]).filter(Boolean)
      const positive = labels.filter((l) => l === "positive").length
      const negative = labels.length - positive
      const sentiment = labels.length === 0 ? "no data" : positive > negative ? "positive" : negative > positive ? "negative" : "mixed"
      return { ...t, mentions: labels.length, positive, negative, sentiment }
    })
  }, [analysedReviews])

  // Compute smart AI recommendations based on negative vs positive metrics
  const recommendations = useMemo(() => {
    const recs = []
    
    const byKey = Object.fromEntries(themes.map((t) => [t.key, t]))

    if (byKey.wifi.negative > 0) {
      recs.push({
        title: "Upgrade High-Speed Router",
        desc: "Multiple guests mentioned network interruptions. Upgrading to a mesh Wi-Fi system will directly address connection drops and improve reviews.",
        type: "actionable",
        impact: "High",
        theme: "WiFi & Internet"
      })
    }

    if (byKey.cleanliness.negative > 0) {
      recs.push({
        title: "Sanitize & Refresh Inspection Checklists",
        desc: "Recent feedback indicates missed spots during turnover. Refresh pre-arrival checklists for your housekeeping team.",
        type: "critical",
        impact: "Critical",
        theme: "Cleanliness"
      })
    } else if (byKey.cleanliness.positive > 2) {
      recs.push({
        title: "Highlight Cleanliness in Listing Description",
        desc: "Guests frequently praise your spotless rooms. Leverage this by adding 'Professional Grade Cleaning Standards' to your Airbnb title/description.",
        type: "marketing",
        impact: "Medium",
        theme: "Cleanliness"
      })
    }

    if (byKey.value.negative > 1) {
      recs.push({
        title: "Add Complimentary Perks",
        desc: "Address perceived high prices by bundling value-adds: free breakfast, a welcome drink, or complimentary airport shuttles.",
        type: "actionable",
        impact: "Medium",
        theme: "Value for Money"
      })
    }

    // Default general recommendation if list is too short
    if (recs.length < 2) {
      recs.push({
        title: "Proactive Feedback Check-in",
        desc: "Schedule an automated check-in message on day 2 of guest stays to catch issues privately before they lead to negative public reviews.",
        type: "actionable",
        impact: "High",
        theme: "General Management"
      })
    }

    return recs
  }, [themes])

  if (loading) return <PageSkeleton label="Loading analytics" variant="dashboard" />

  const positivePct = total > 0 ? Math.round((positive / total) * 100) : 0

  return (
    <div className="space-y-8 animate-slide-up-sm">
      {/* Toast Alert Portal */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 pointer-events-none">
          <Toast
            message={`Error loading analytics: ${toastMessage}`}
            type="error"
            onClose={dismissToast}
          />
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-(--color-border)/30 dark:border-white/5 pb-5">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-(--color-ink) dark:text-white flex items-center gap-2">
            <Sparkles className="text-(--color-brand-500) dark:text-(--color-brand-400)" size={24} />
            Workspace Analytics & AI Insights
          </h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">
            Real-time sentiment breakdown, rating distributions, and AI-extracted guest feedback themes.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-(--color-brand-500)/10 border border-(--color-brand-500)/20 text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) shadow-sm">
            <MessageSquare size={13} />
            {total} Reviews Analyzed
          </span>
        </div>
      </div>

      {/* Dynamic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Average Rating */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-(--color-brand-500)/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Average Rating</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500">
              <Star size={14} className="fill-amber-500" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-heading text-4xl font-bold text-(--color-ink) dark:text-white">{avgRating}</span>
            <span className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">/ 5.0</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Excellent</span>
            <span>&bull; Based on {total} guest experiences</span>
          </div>
        </div>

        {/* Card 2: Sentiment Health */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Sentiment Health</span>
            <span className={`p-1.5 rounded-lg ${positivePct >= 70 ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
              {positivePct >= 70 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-heading text-4xl font-bold text-emerald-700 dark:text-emerald-400">{positivePct}%</span>
            <span className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">Positive</span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">
            <span className={`font-semibold ${positivePct >= 80 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
              {positivePct >= 80 ? "Highly Satisfied" : "Moderate Satisfaction"}
            </span>
            <span>&bull; {negative} negative reviews</span>
          </div>
        </div>

        {/* Card 3: Reputation Level */}
        <div className="glass-card rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div className="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-(--color-accent-500)/10 blur-xl pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Reputation Level</span>
            <span className="p-1.5 rounded-lg bg-(--color-accent-500)/10 text-(--color-accent-600)">
              <TrendingUp size={14} />
            </span>
          </div>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="font-heading text-4xl font-bold text-(--color-ink) dark:text-white">
              {parseFloat(avgRating) >= 4.5 ? "Superhost" : "Healthy"}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">
            <span className="font-semibold text-sky-700 dark:text-sky-400">Active</span>
            <span>&bull; {neutral} neutral responses</span>
          </div>
        </div>
      </div>

      {/* Charts & Distribution Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sentiment Distribution Card */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 lg:col-span-7 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-(--color-brand-500)/10 text-(--color-brand-500) shadow-sm">
                <PieChart size={18} />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-(--color-ink) dark:text-white">Sentiment Distribution</h2>
                <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">Percentage share of positive, neutral, and negative feedback</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-8 mb-8">
              {/* Circular Chart */}
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90 filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
                  <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" className="text-(--color-border) dark:text-(--color-border-dark)" />
                  {total > 0 && (
                    <>
                      <circle className="sweep" cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(positive / total) * 88} ${88 - (positive / total) * 88}`} strokeDashoffset="0" className="text-emerald-500 transition-all duration-1000" strokeLinecap="round" />
                      <circle className="sweep" cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(neutral / total) * 88} ${88 - (neutral / total) * 88}`} strokeDashoffset={`${-((positive / total) * 88)}`} className="text-amber-500 transition-all duration-1000" strokeLinecap="round" />
                      <circle className="sweep" cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray={`${(negative / total) * 88} ${88 - (negative / total) * 88}`} strokeDashoffset={`${-(((positive + neutral) / total) * 88)}`} className="text-rose-500 transition-all duration-1000" strokeLinecap="round" />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 dark:bg-black/20 backdrop-blur-[1px] rounded-full m-3 shadow-inner">
                  <span className="font-heading text-2xl font-bold text-(--color-ink) dark:text-white">{total}</span>
                  <span className="text-[8px] uppercase font-bold tracking-wider text-(--color-muted) dark:text-(--color-muted-dark)">Reviews</span>
                </div>
              </div>

              {/* Legend with Metrics */}
              <div className="space-y-3.5 w-full sm:flex-1">
                {sentimentBars.map((b) => (
                  <div key={b.label} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${b.color} shrink-0 ring-2 ring-white dark:ring-(--color-surface-elevated-dark) shadow-sm`} />
                    <span className="text-xs font-semibold text-(--color-ink) dark:text-white flex-1">{b.label}</span>
                    <div className="text-right">
                      <span className="text-xs font-bold text-(--color-ink) dark:text-white mr-1.5">{b.pct}%</span>
                      <span className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">({b.count})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-4 pt-4 border-t border-(--color-border)/20 dark:border-white/5">
            {sentimentBars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1.5 font-medium">
                  <span className="font-semibold text-(--color-ink) dark:text-white">{b.label} Sentiment</span>
                  <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{b.count} reviews ({b.pct}%)</span>
                </div>
                <div className="h-2.5 rounded-full bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) border border-(--color-border)/20 dark:border-white/5 overflow-hidden">
                  <div
                    className={`grow-x h-full rounded-full ${b.color}`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Rating Breakdown Card */}
        <div className="glass-card rounded-2xl p-6 lg:p-8 lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-(--color-accent-500)/10 text-(--color-accent-600) shadow-sm">
                <BarChart3 size={18} />
              </div>
              <div>
                <h2 className="font-heading text-base font-bold text-(--color-ink) dark:text-white">Rating Distribution</h2>
                <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">Breakdown of guest feedback from 5 to 1 Stars</p>
              </div>
            </div>

            {/* Big Score Block */}
            <div className="flex items-center gap-5 mb-8 p-4 rounded-2xl bg-(--color-surface-muted) dark:bg-white/[0.04] border border-(--color-brand-500)/10 shadow-sm">
              <span className="font-heading text-5xl font-bold text-(--color-ink) dark:text-white tracking-tight">
                {avgRating}
              </span>
              <div className="h-12 w-px bg-(--color-border)/40 dark:bg-white/10" />
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      size={15}
                      className={`${s <= Math.round(parseFloat(avgRating)) ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-white/10"}`}
                    />
                  ))}
                </div>
                <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) mt-1 font-medium">Average from {total} reviews</p>
              </div>
            </div>
          </div>

          {/* Rating Bars */}
          <div className="space-y-3.5">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = filteredReviews.filter((r) => r.rating === star).length
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={star} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 w-8 shrink-0">
                    <span className="text-xs font-bold text-(--color-ink) dark:text-white">{star}</span>
                    <Star size={11} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex-grow h-2.5 rounded-full bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) border border-(--color-border)/20 dark:border-white/5 overflow-hidden">
                    <div
                      className="grow-x h-full rounded-full bg-amber-400"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-(--color-muted) dark:text-(--color-muted-dark) font-semibold w-6 text-right shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* AI Extracted Themes Grid */}
      <div className="glass-card rounded-2xl p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-violet-100 dark:bg-violet-900/40 shadow-sm">
            <TrendingUp size={18} className="text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-(--color-ink) dark:text-white">Detected Guest Themes</h2>
            <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">AI aspect labels from {analysedReviews.length} of {filteredReviews.length} reviews</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {themes.map((t) => {
            const IconComponent = t.icon
            return (
              <div 
                key={t.name} 
                className="group rounded-2xl bg-(--color-surface-muted) dark:bg-white/5 border border-(--color-border)/20 dark:border-white/5 p-4 hover:-translate-y-1 hover:shadow-md transition-all flex flex-col justify-between min-h-[140px] relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-xl ${t.colorClass} shadow-sm shrink-0`}>
                    <IconComponent size={15} />
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    t.sentiment === "positive" ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                    : t.sentiment === "negative" ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/20"
                    : "bg-amber-500/10 text-amber-800 dark:text-amber-400 ring-1 ring-amber-500/20"
                  }`}>
                    {t.sentiment}
                  </span>
                </div>
                
                <div>
                  <p className="font-heading text-sm font-bold text-(--color-ink) dark:text-white leading-snug">{t.name}</p>
                  <div className="flex items-center justify-between mt-2.5">
                    <span className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark) font-medium">{t.mentions} mention{t.mentions === 1 ? "" : "s"}{t.mentions > 0 && ` · ${t.positive}+ / ${t.negative}−`}</span>
                    {t.sentiment === "negative" && t.mentions > 0 && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* AI Recommendations Section */}
      <div className="glass-card rounded-2xl p-6 lg:p-8 bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) border border-(--color-brand-500)/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 shadow-sm">
            <Info size={18} />
          </div>
          <div>
            <h2 className="font-heading text-base font-bold text-(--color-ink) dark:text-white">AI-Generated Recommendations</h2>
            <p className="text-[10px] text-(--color-muted) dark:text-(--color-muted-dark)">Data-driven suggestions to boost occupancy and guest ratings</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((r) => (
            <div 
              key={r.title} 
              className="flex items-start gap-4 p-4.5 rounded-2xl bg-white/40 dark:bg-white/5 border border-(--color-border)/20 dark:border-white/5 shadow-sm relative overflow-hidden"
            >
              <div className="mt-0.5">
                {r.impact === "Critical" ? (
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
                    <AlertCircle size={16} className="animate-pulse" />
                  </div>
                ) : r.impact === "High" ? (
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400">
                    <TrendingDown size={16} />
                  </div>
                ) : (
                  <div className="p-2 rounded-xl bg-sky-500/10 text-sky-500">
                    <TrendingUp size={16} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-(--color-ink) dark:text-white">{r.title}</h4>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    r.impact === "Critical" ? "bg-rose-500/10 text-rose-700 dark:text-rose-400"
                    : r.impact === "High" ? "bg-amber-500/10 text-amber-700 dark:text-amber-400"
                    : "bg-sky-500/10 text-sky-700 dark:text-sky-400"
                  }`}>
                    {r.impact} Impact
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">
                  {r.desc}
                </p>
                <div className="text-[9px] font-semibold text-(--color-brand-500) dark:text-(--color-brand-400) uppercase tracking-wider pt-1.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-(--color-brand-500) dark:bg-(--color-brand-400)"></span>
                  Theme: {r.theme}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
