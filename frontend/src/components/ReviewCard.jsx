import { Star, Sparkles, ShieldAlert, Check, Trash2 } from "lucide-react"
import Button from "./ui/Button"
import { detectSpam } from "../data/spamFilter"

const sentimentStyles = {
  positive: "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) ring-1 ring-(--color-brand-300)/20 dark:ring-(--color-brand-700)/50",
  neutral: "bg-(--color-silver-100) text-(--color-silver-700) dark:bg-(--color-silver-800)/40 dark:text-(--color-silver-300) ring-1 ring-(--color-silver-200) dark:ring-(--color-silver-800)/50",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-300/20 dark:ring-red-800/30",
}

export default function ReviewCard({ review, onReply, onDelete, onUnflag }) {
  const { guestName, propertyName, rating, text, date, sentiment, source } = review

  // Detect spam dynamically (supporting unflagging override state)
  const spamDetection = detectSpam(text, guestName)
  const isSpam = spamDetection.isSpam && !review.isUnflagged

  return (
    <div className={`group relative rounded-2xl widget-card p-5 transition-all duration-300 ${isSpam ? "border-red-500/30 bg-red-500/5 dark:bg-red-950/5 ring-1 ring-red-500/10" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 ${isSpam ? "bg-red-500" : sentiment === "positive" ? "bg-(--color-brand-400)" : sentiment === "negative" ? "bg-red-400" : "bg-(--color-accent-400)"} group-hover:w-1.5`} />

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
        <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${isSpam ? "bg-red-500/10 text-red-500 ring-1 ring-red-500/20" : sentimentStyles[sentiment]}`}>
          {isSpam ? "spam flagged" : sentiment}
        </span>
      </div>

      <div className="flex items-center gap-0.5 mt-3 pl-2">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            size={12}
            className={`${i < rating ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-(--color-border-dark)"} transition-all duration-300`}
          />
        ))}
        <span className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) ml-1.5 font-semibold">{rating}.0</span>
      </div>

      <p className="mt-2.5 text-sm text-(--color-brand-600)/80 dark:text-(--color-muted-dark) leading-relaxed line-clamp-3 pl-2">
        {text}
      </p>

      {isSpam && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] mt-3.5 pl-2 ml-2 select-none w-fit">
          <ShieldAlert size={13} className="shrink-0 animate-pulse-soft" />
          <span>Flagged: {spamDetection.reason}</span>
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50 pl-2">
        <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) bg-(--color-brand-50) dark:bg-(--color-brand-900)/40 px-2 py-0.5 rounded-md">
          {source}
        </span>
        {isSpam ? (
          <div className="flex items-center gap-2">
            {onUnflag && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Check size={11} />}
                onClick={() => onUnflag(review.id)}
                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/5 dark:hover:bg-emerald-500/10 rounded-xl"
              >
                Mark Valid
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                icon={<Trash2 size={11} />}
                onClick={() => onDelete(review.id)}
                className="text-red-500 hover:text-red-600 hover:bg-red-500/5 dark:hover:bg-red-500/10 rounded-xl"
              >
                Delete
              </Button>
            )}
          </div>
        ) : (
          onReply && (
            <Button
              size="sm"
              variant="secondary"
              icon={<Sparkles size={12} />}
              onClick={() => onReply(review)}
            >
              AI Reply
            </Button>
          )
        )}
      </div>
    </div>
  )
}
