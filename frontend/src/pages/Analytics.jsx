import { mockReviews } from "../data/mockReviews"

const positive = mockReviews.filter((r) => r.sentiment === "positive").length
const neutral = mockReviews.filter((r) => r.sentiment === "neutral").length
const negative = mockReviews.filter((r) => r.sentiment === "negative").length
const total = mockReviews.length

const sentimentBars = [
  { label: "Positive", count: positive, color: "bg-[--color-brand-400]", pct: Math.round((positive / total) * 100) },
  { label: "Neutral", count: neutral, color: "bg-[--color-gold-400]", pct: Math.round((neutral / total) * 100) },
  { label: "Negative", count: negative, color: "bg-red-400", pct: Math.round((negative / total) * 100) },
]

export default function Analytics() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-bold text-[--color-brand-600] dark:text-white">Analytics</h1>
        <span className="text-xs text-[--color-muted] dark:text-[--color-muted-dark]">{total} reviews analyzed</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="rounded-xl border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-5">
          <h2 className="font-heading text-sm font-semibold text-[--color-brand-600] dark:text-white mb-5">Sentiment Distribution</h2>
          <div className="space-y-4">
            {sentimentBars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="font-medium text-[--color-brand-600] dark:text-white">{b.label}</span>
                  <span className="text-[--color-muted] dark:text-[--color-muted-dark]">{b.count} ({b.pct}%)</span>
                </div>
                <div className="h-2 bg-[--color-border] dark:bg-[--color-border-dark] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${b.color} transition-all duration-500`}
                    style={{ width: `${b.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-5">
          <h2 className="font-heading text-sm font-semibold text-[--color-brand-600] dark:text-white mb-5">Rating Breakdown</h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = mockReviews.filter((r) => r.rating === star).length
              const pct = Math.round((count / total) * 100)
              return (
                <div key={star}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium text-[--color-brand-600] dark:text-white">{star} star{star > 1 ? "s" : ""}</span>
                    <span className="text-[--color-muted] dark:text-[--color-muted-dark]">{count}</span>
                  </div>
                  <div className="h-2 bg-[--color-border] dark:bg-[--color-border-dark] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[--color-gold-400] transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
