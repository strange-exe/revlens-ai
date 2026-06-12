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

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Reviews</h1>
        <span className="text-sm text-gray-500 dark:text-gray-400">{filtered.length} reviews</span>
      </div>
      <div className="max-w-md mb-6">
        <SearchBar value={search} onChange={setSearch} placeholder="Search reviews, guests, or properties..." />
      </div>
      {filtered.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No reviews match your search.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </>
  )
}
