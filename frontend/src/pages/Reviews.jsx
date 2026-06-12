import { useState, useMemo } from "react"
import { mockReviews } from "../data/mockReviews"
import ReviewCard from "../components/ReviewCard"
import SearchBar from "../components/SearchBar"

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
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-bold text-[--color-brand-600] dark:text-white">Reviews</h1>
        <div className="flex items-center gap-3 text-xs text-[--color-muted] dark:text-[--color-muted-dark]">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[--color-brand-400]" /> {positive} positive
          </span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> {negative} negative
          </span>
          <span className="font-medium">{filtered.length} total</span>
        </div>
      </div>
      <div className="max-w-md mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search reviews, guests, or properties..." />
      </div>
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-sm text-[--color-muted] dark:text-[--color-muted-dark]">No reviews match your search.</p>
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
