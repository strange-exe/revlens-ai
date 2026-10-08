import { describe, expect, it } from "vitest"
import { PERIODS, aspectInsights, delta, inWindow, parseDay, periodStats, spamSummary, summarize } from "./reviewMetrics"

const NOW = parseDay("2026-10-04")
const review = (date, overrides = {}) => ({
  date, rating: 4, sentiment: "positive", isSpam: false, isUnflagged: false, response: null,
  aspects: null, labelSource: "llm", ...overrides,
})
const period = (key) => PERIODS.find((p) => p.key === key)

describe("windows", () => {
  it("splits current and previous windows without overlap", () => {
    const reviews = [review("2026-10-03"), review("2026-09-05"), review("2026-09-04"), review("2026-08-01")]
    expect(inWindow(reviews, 30, NOW, 0).map((r) => r.date)).toEqual(["2026-10-03", "2026-09-05"])
    expect(inWindow(reviews, 30, NOW, 1).map((r) => r.date)).toEqual(["2026-09-04"])
  })

  it("ignores unparseable dates instead of crashing", () => {
    expect(inWindow([review("not a date")], 30, NOW)).toEqual([])
  })
})

describe("summaries and deltas", () => {
  it("excludes spam (unless unflagged) and returns null for empty periods", () => {
    const s = summarize([review("2026-10-01", { isSpam: true }), review("2026-10-01", { isSpam: true, isUnflagged: true })])
    expect(s.total).toBe(1)
    expect(summarize([]).avgRating).toBeNull()
  })

  it("computes real deltas, and null when there is no previous data", () => {
    const reviews = [
      review("2026-10-01", { rating: 5, response: "Thanks!" }),
      review("2026-09-01", { rating: 3, sentiment: "neutral" }),
    ]
    const stats = periodStats(reviews, period("30d"), NOW)
    expect(delta(stats, "avgRating")).toBe(2)
    expect(delta(stats, "positiveRate")).toBe(1)
    expect(delta(periodStats([review("2026-10-01")], period("30d"), NOW), "total")).toBeNull()
    expect(periodStats(reviews, period("all"), NOW).previous).toBeNull()
  })
})

describe("insights", () => {
  it("counts only AI-analysed, non-spam reviews", () => {
    const reviews = [
      review("2026-10-01", { aspects: { wifi: "negative", cleanliness: "positive", food: "negative" } }),
      review("2026-10-01", { aspects: { wifi: "negative" } }),
      review("2026-10-01", { aspects: null }),
      review("2026-10-01", { isSpam: true, aspects: { wifi: "positive" } }),
    ]
    const insights = aspectInsights(reviews)
    expect(insights.analysed).toBe(2)
    expect(insights.topTheme.key).toBe("wifi")
    expect(insights.topIssue).toMatchObject({ key: "wifi", negative: 2 })
  })

  it("has no insight when nothing was analysed", () => {
    expect(aspectInsights([review("2026-10-01")])).toMatchObject({ analysed: 0, topTheme: null, topIssue: null })
  })

  it("splits spam by who flagged it", () => {
    const s = spamSummary([
      review("2026-10-01", { isSpam: true, labelSource: "human" }),
      review("2026-10-01", { isSpam: true, labelSource: "model" }),
      review("2026-10-01", { isSpam: true, labelSource: null }),
    ])
    expect(s).toEqual({ count: 3, bySource: { human: 1, model: 1, unknown: 1 } })
  })

  it("attributes spam on sample properties to the sample data, not the host", () => {
    const s = spamSummary([
      review("2026-10-01", { isSpam: true, labelSource: "human", propertyId: 1 }),
      review("2026-10-01", { isSpam: true, labelSource: "human", propertyId: 9 }),
      review("2026-10-01", { isSpam: true, labelSource: "llm", propertyId: 9 }),
    ], (r) => r.propertyId === 9)
    expect(s).toEqual({ count: 3, bySource: { human: 1, sample: 2 } })
  })
})
