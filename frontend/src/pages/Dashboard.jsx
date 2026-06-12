import { mockReviews, properties } from "../data/mockReviews"
import ReviewCard from "../components/ReviewCard"
import { MessageSquareText, Building2, Star, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Total Reviews",
    value: mockReviews.length,
    icon: MessageSquareText,
    color: "text-[--color-brand-500] bg-[--color-brand-100] dark:bg-[--color-brand-800]",
  },
  {
    label: "Properties",
    value: properties.length,
    icon: Building2,
    color: "text-[--color-brand-400] bg-[--color-brand-50] dark:bg-[--color-brand-800]",
  },
  {
    label: "Avg Rating",
    value: (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1),
    icon: Star,
    color: "text-[--color-gold-500] bg-[--color-gold-100] dark:bg-[--color-gold-900]/40",
  },
  {
    label: "Positive Rate",
    value: `${Math.round((mockReviews.filter((r) => r.sentiment === "positive").length / mockReviews.length) * 100)}%`,
    icon: TrendingUp,
    color: "text-[--color-brand-500] bg-[--color-brand-100] dark:bg-[--color-brand-800]",
  },
]

export default function Dashboard() {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-bold text-[--color-brand-600] dark:text-white">Overview</h1>
        <span className="text-xs text-[--color-muted] dark:text-[--color-muted-dark]">Last 30 days</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-4">
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon size={18} />
              </div>
            </div>
            <p className="mt-3 font-heading text-2xl font-bold text-[--color-brand-600] dark:text-white">{s.value}</p>
            <p className="text-xs text-[--color-muted] dark:text-[--color-muted-dark]">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-base font-semibold text-[--color-brand-600] dark:text-white">Recent Reviews</h2>
          <span className="text-[11px] text-[--color-muted] dark:text-[--color-muted-dark]">Latest 4</span>
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
