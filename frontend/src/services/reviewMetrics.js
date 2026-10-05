// Dashboard numbers, computed from the reviews themselves. A value that can't be computed is null
// (shown as "n/a"); nothing here is ever a placeholder.
import { isSpamReview } from "./reviewFilters"

const DAY_MS = 24 * 60 * 60 * 1000

export const PERIODS = [
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "365d", label: "Last 12 months", days: 365 },
  { key: "all", label: "All time", days: null },
]

export const ASPECT_LABELS = {
  cleanliness: "Cleanliness",
  location: "Location & Views",
  wifi: "WiFi & Internet",
  host: "Host Hospitality",
  value: "Value for Money",
  amenities: "Rooms & Amenities",
}

/** "YYYY-MM-DD" -> ms at UTC midnight, or null if unparseable. */
export function parseDay(date) {
  const ms = Date.parse(`${date}T00:00:00Z`)
  return Number.isNaN(ms) ? null : ms
}

/** Reviews in the k-th window of `days` whole days ending today (k=0: today and the days-1 before it;
 *  k=1: the window before that). Whole days, so results don't depend on the time of day. */
export function inWindow(reviews, days, now, k = 0) {
  if (days == null) return reviews
  const endOfToday = Math.floor(now / DAY_MS) * DAY_MS + DAY_MS
  const end = endOfToday - k * days * DAY_MS
  const start = end - days * DAY_MS
  return reviews.filter((r) => {
    const t = parseDay(r.date)
    return t != null && t >= start && t < end
  })
}

export function summarize(reviews) {
  const valid = reviews.filter((r) => !isSpamReview(r))
  const total = valid.length
  const ratio = (n) => (total ? n / total : null)
  return {
    total,
    avgRating: total ? valid.reduce((s, r) => s + r.rating, 0) / total : null,
    positiveRate: ratio(valid.filter((r) => r.sentiment === "positive").length),
    replied: valid.filter((r) => r.response).length,
    responseRate: ratio(valid.filter((r) => r.response).length),
  }
}

/** Current-period summary plus the previous period of the same length (null for "all time"). */
export function periodStats(reviews, period, now = Date.now()) {
  return {
    current: summarize(inWindow(reviews, period.days, now, 0)),
    previous: period.days == null ? null : summarize(inWindow(reviews, period.days, now, 1)),
  }
}

/** current - previous for one field, or null when there is nothing to compare against. */
export function delta(stats, field) {
  const prev = stats.previous
  if (!prev || prev.total === 0 || prev[field] == null || stats.current[field] == null) return null
  return stats.current[field] - prev[field]
}

/** Aggregate stored AI aspect labels. Only reviews the AI analysed (aspects != null) count. */
export function aspectInsights(reviews) {
  const analysed = reviews.filter((r) => !isSpamReview(r) && r.aspects)
  const aspects = Object.keys(ASPECT_LABELS).map((key) => {
    const labels = analysed.map((r) => r.aspects[key]).filter(Boolean)
    const positive = labels.filter((l) => l === "positive").length
    return { key, label: ASPECT_LABELS[key], mentions: labels.length, positive, negative: labels.length - positive }
  })
  const mentioned = aspects.filter((a) => a.mentions > 0)
  const byMentions = [...mentioned].sort((a, b) => b.mentions - a.mentions)
  const byNegative = mentioned.filter((a) => a.negative > 0).sort((a, b) => b.negative - a.negative)
  return { analysed: analysed.length, aspects, topTheme: byMentions[0] ?? null, topIssue: byNegative[0] ?? null }
}

/** Spam count split by who flagged it, so the UI never attributes a manual flag to "AI". */
export function spamSummary(reviews) {
  const spam = reviews.filter(isSpamReview)
  const bySource = {}
  for (const r of spam) {
    const source = r.labelSource ?? "unknown"
    bySource[source] = (bySource[source] ?? 0) + 1
  }
  return { count: spam.length, bySource }
}
