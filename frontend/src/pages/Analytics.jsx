import { mockReviews } from "../data/mockReviews"

const positive = mockReviews.filter((r) => r.sentiment === "positive").length
const neutral = mockReviews.filter((r) => r.sentiment === "neutral").length
const negative = mockReviews.filter((r) => r.sentiment === "negative").length
const total = mockReviews.length

const bars = [
  { label: "Positive", count: positive, color: "bg-green-500", pct: Math.round((positive / total) * 100) },
  { label: "Neutral", count: neutral, color: "bg-yellow-500", pct: Math.round((neutral / total) * 100) },
  { label: "Negative", count: negative, color: "bg-red-500", pct: Math.round((negative / total) * 100) },
]

export default function Analytics() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Sentiment Distribution</h2>
          <div className="space-y-4">
            {bars.map((b) => (
              <div key={b.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{b.label}</span>
                  <span className="text-gray-500 dark:text-gray-400">{b.count} ({b.pct}%)</span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${b.color} transition-all`} style={{ width: `${b.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-lg font-semibold mb-4">Rating Breakdown</h2>
          <div className="space-y-4">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = mockReviews.filter((r) => r.rating === star).length
              const pct = Math.round((count / total) * 100)
              return (
                <div key={star}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{star} star{star > 1 ? "s" : ""}</span>
                    <span className="text-gray-500 dark:text-gray-400">{count} reviews</span>
                  </div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
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
