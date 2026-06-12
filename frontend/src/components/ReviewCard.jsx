import { Star } from "lucide-react"

const sentimentColors = {
  positive: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  neutral: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
}

export default function ReviewCard({ review }) {
  const { guestName, propertyName, rating, text, date, sentiment, source } = review

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
      <div className="flex items-start justify-between">
        <div>
          <h4 className="font-semibold">{guestName}</h4>
          <p className="text-xs text-gray-500 dark:text-gray-400">{propertyName} &middot; {date}</p>
        </div>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${sentimentColors[sentiment]}`}>
          {sentiment}
        </span>
      </div>
      <div className="flex items-center gap-0.5 mt-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={14}
            className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300 dark:text-gray-600"}
          />
        ))}
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{rating}/5</span>
      </div>
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
        {text}
      </p>
      <span className="inline-block mt-3 text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
        {source}
      </span>
    </div>
  )
}
