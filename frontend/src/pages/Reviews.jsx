import { useState, useMemo } from "react"
import { mockReviews } from "../data/mockReviews"
import ReviewCard from "../components/ReviewCard"
import SearchBar from "../components/SearchBar"
import { MessageSquareText } from "lucide-react"

export default function Reviews() {
  const [search, setSearch] = useState("")

  const filtered = useMemo(
    () =>
      mockReviews.filter(
        (r) =>
          r.guestName.toLowerCase().includes(search.toLowerCase()) ||
          r.propertyName.toLowerCase().includes(search.toLowerCase()) ||
          r.text.toLowerCase().includes(search.toLowerCase()),
      ),
    [search],
  )

  const positive = filtered.filter((r) => r.sentiment === "positive").length
  const negative = filtered.filter((r) => r.sentiment === "negative").length

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold text-(--color-brand-600) dark:text-white">Reviews</h1>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) mt-1">Search and browse guest feedback</p>
        </div>
        <div className="flex items-center gap-4 text-xs text-(--color-muted) dark:text-(--color-muted-dark) widget-card px-3.5 py-2 rounded-xl">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-(--color-brand-400)" />
            {positive} positive
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-400" />
            {negative} negative
          </span>
          <span className="font-semibold text-(--color-brand-500) dark:text-(--color-gold-400)">{filtered.length} total</span>
        </div>
      </div>

      <div className="max-w-md mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search reviews, guests, or properties..." />
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 rounded-xl bg-(--color-brand-100) dark:bg-(--color-brand-800) flex items-center justify-center mx-auto mb-4">
            <MessageSquareText size={20} className="text-(--color-brand-400)" />
          </div>
          <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">No reviews match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {filtered.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </>
  )
}
