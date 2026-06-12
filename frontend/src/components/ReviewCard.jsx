import { Star } from "lucide-react"

const sentimentStyles = {
  positive: "bg-[--color-brand-100] text-[--color-brand-600] dark:bg-[--color-brand-800] dark:text-[--color-brand-300]",
  neutral: "bg-[--color-gold-100] text-[--color-gold-600] dark:bg-[--color-gold-900]/40 dark:text-[--color-gold-400]",
  negative: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400",
}

export default function ReviewCard({ review }) {
  const { guestName, propertyName, rating, text, date, sentiment, source } = review

  return (
    <div className="group relative rounded-xl border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-5 hover:border-[--color-brand-200] dark:hover:border-[--color-brand-800] transition-all duration-300">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[--color-brand-200] dark:bg-[--color-brand-700] flex items-center justify-center text-xs font-bold text-[--color-brand-600] dark:text-[--color-brand-300] flex-shrink-0">
              {guestName.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[--color-brand-600] dark:text-white truncate">{guestName}</h4>
              <p className="text-[11px] text-[--color-muted] dark:text-[--color-muted-dark]">{propertyName} &middot; {date}</p>
            </div>
          </div>
        </div>
        <span className={`shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full ${sentimentStyles[sentiment]}`}>
          {sentiment}
        </span>
      </div>
      <div className="flex items-center gap-0.5 mt-3">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={i < rating ? "fill-[--color-gold-400] text-[--color-gold-400]" : "text-[--color-border] dark:text-[--color-border-dark]"}
          />
        ))}
        <span className="text-[11px] text-[--color-muted] dark:text-[--color-muted-dark] ml-1.5 font-medium">{rating}.0</span>
      </div>
      <p className="mt-2 text-sm text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed line-clamp-3">
        {text}
      </p>
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[--color-border]/50 dark:border-[--color-border-dark]/50">
        <span className="text-[10px] font-medium text-[--color-muted] dark:text-[--color-muted-dark] bg-[--color-brand-50] dark:bg-[--color-brand-900]/30 px-2 py-0.5 rounded">
          {source}
        </span>
      </div>
    </div>
  )
}
