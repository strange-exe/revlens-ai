import { mockReviews, properties } from "../data/mockReviews"
import ReviewCard from "../components/ReviewCard"
import { MessageSquareText, Building2, Star, TrendingUp } from "lucide-react"

const stats = [
  {
    label: "Total Reviews",
    value: mockReviews.length,
    icon: MessageSquareText,
    color: "text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/40",
  },
  {
    label: "Properties",
    value: properties.length,
    icon: Building2,
    color: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40",
  },
  {
    label: "Avg Rating",
    value: (mockReviews.reduce((s, r) => s + r.rating, 0) / mockReviews.length).toFixed(1),
    icon: Star,
    color: "text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/40",
  },
  {
    label: "Positive Rate",
    value: `${Math.round((mockReviews.filter((r) => r.sentiment === "positive").length / mockReviews.length) * 100)}%`,
    icon: TrendingUp,
    color: "text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/40",
  },
]

export default function Dashboard() {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">Overview</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.color}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Reviews</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {mockReviews.slice(0, 4).map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      </div>
    </>
  )
}
