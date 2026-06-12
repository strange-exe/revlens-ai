import { Star } from "lucide-react"

const sentimentStyles = {
  positive: "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) ring-1 ring-(--color-brand-300)/20 dark:ring-(--color-brand-700)/50",
  neutral: "bg-(--color-gold-100) text-(--color-gold-700) dark:bg-(--color-gold-900)/40 dark:text-(--color-gold-400) ring-1 ring-(--color-gold-300)/20 dark:ring-(--color-gold-800)/30",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-300/20 dark:ring-red-800/30",
}

export default function ReviewCard({ review }) {
  const { guestName, propertyName, rating, text, date, sentiment, source } = review

  return (
    <div className="group relative rounded-2xl widget-card p-5">
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 ${sentiment === "positive" ? "bg-(--color-brand-400)" : sentiment === "negative" ? "bg-red-400" : "bg-(--color-gold-400)"} group-hover:w-1.5`} />

      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {guestName.charAt(0)}
              <span className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/0 to-white/20" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-(--color-brand-600) dark:text-white truncate">{guestName}</h4>
              <p className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark)">{propertyName} &middot; {date}</p>
            </div>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${sentimentStyles[sentiment]}`}>
          {sentiment}
        </span>
      </div>

      <div className="flex items-center gap-0.5 mt-3 pl-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={`${i < rating ? "fill-(--color-gold-400) text-(--color-gold-400)" : "text-(--color-border) dark:text-(--color-border-dark)"} transition-all duration-300`}
          />
        ))}
        <span className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) ml-1.5 font-semibold">{rating}.0</span>
      </div>

      <p className="mt-2.5 text-sm text-(--color-brand-600)/80 dark:text-(--color-muted-dark) leading-relaxed line-clamp-3 pl-2">
        {text}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50 pl-2">
        <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) bg-(--color-brand-50) dark:bg-(--color-brand-900)/40 px-2 py-0.5 rounded-md">
          {source}
        </span>
      </div>
    </div>
  )
}
