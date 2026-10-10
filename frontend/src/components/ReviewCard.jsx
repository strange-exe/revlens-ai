import { useState } from "react"
import { Star, Sparkles, ShieldAlert, Check, Trash2, Pencil } from "lucide-react"
import Button from "./ui/Button"
import { LabelEditor, LabelQuestion } from "./LabelCheck"
import { ASPECT_SHORT } from "../services/reviewMetrics"

const aspectText = {
  positive: "text-emerald-700 dark:text-emerald-400",
  negative: "text-rose-700 dark:text-rose-400",
}

const sentimentStyles = {
  positive: "bg-(--color-brand-100) text-(--color-brand-700) dark:bg-(--color-brand-800) dark:text-(--color-brand-300) ring-1 ring-(--color-brand-300)/20 dark:ring-(--color-brand-700)/50",
  neutral: "bg-(--color-silver-100) text-(--color-silver-700) dark:bg-(--color-silver-800)/40 dark:text-(--color-silver-300) ring-1 ring-(--color-silver-200) dark:ring-(--color-silver-800)/50",
  negative: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 ring-1 ring-red-300/20 dark:ring-red-800/30",
}

// Who produced the sentiment/spam label (backend `label_source`)
const labelSourceBadges = {
  // Named apart: the two engines label differently, and a host should be able to tell which one answered
  llm: { text: "Gemini", title: "Labelled by Gemini (used when RevLens's own model is unavailable)" },
  model: { text: "AI model", title: "Labelled by RevLens's trained model" },
  heuristic: { text: "Keyword guess", title: "AI was unavailable; labelled by a simple keyword rule" },
  human: { text: "Manual", title: "Labelled or corrected by a person" },
}

// onCheckLabels is passed only for the host's own reviews: the shared sample reviews are read-only
export default function ReviewCard({ review, onReply, onDelete, onUnflag, onCheckLabels }) {
  const { guestName, propertyName, rating, text, date, sentiment, source } = review
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)

  // Spam is decided by the backend; unflagging is the owner's override
  const isSpam = review.isSpam && !review.isUnflagged
  const badge = review.labelSource === "human" && review.labelCheckedAt
    ? { text: "Checked by you", title: "You confirmed or corrected these labels" }
    : labelSourceBadges[review.labelSource]
  const canCheck = Boolean(onCheckLabels) && !isSpam

  const confirm = async () => {
    setConfirming(true)
    try {
      await onCheckLabels(review.id, { sentiment, aspects: review.aspects || {} })
    } catch {
      // the page shows the error; the question stays so the host can try again
    } finally {
      setConfirming(false)
    }
  }
  const saveCorrection = async (labels) => {
    await onCheckLabels(review.id, labels)
    setEditing(false)
  }
  // What the review says about each aspect it mentions, in a fixed order (null = not analysed yet)
  const aspects = Object.keys(ASPECT_SHORT).filter((k) => ["positive", "negative"].includes(review.aspects?.[k]))

  return (
    <div className={`lift group relative rounded-2xl widget-card p-5 ${isSpam ? "border-red-500/30 bg-red-500/5 dark:bg-red-950/5 ring-1 ring-red-500/10" : ""}`}>
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl transition-all duration-300 ${isSpam ? "bg-red-500" : sentiment === "positive" ? "bg-(--color-brand-400)" : sentiment === "negative" ? "bg-red-400" : "bg-(--color-accent-400)"} group-hover:w-1.5`} />

      <div className="flex items-start justify-between gap-4 pl-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-full bg-(--color-brand-600) flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-sm">
              {guestName.charAt(0)}
            </div>
            <div>
              <h4 className="text-sm font-bold text-(--color-ink) dark:text-white truncate">{guestName}</h4>
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

      <p className="mt-2.5 text-sm text-(--color-ink) dark:text-white/85 leading-relaxed line-clamp-3 pl-2">
        {text}
      </p>

      {!isSpam && aspects.length > 0 && (
        <p className="mt-2.5 pl-2 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold" aria-label="Aspects mentioned">
          {aspects.map((k) => (
            <span key={k} className={aspectText[review.aspects[k]]}>
              {ASPECT_SHORT[k]} {review.aspects[k] === "positive" ? "+" : "−"}
              <span className="sr-only"> ({review.aspects[k]})</span>
            </span>
          ))}
        </p>
      )}

      {canCheck && editing && (
        <LabelEditor review={review} onSave={saveCorrection} onCancel={() => setEditing(false)} />
      )}
      {canCheck && !editing && review.needsCheck && (
        <LabelQuestion review={review} onConfirm={confirm} onFix={() => setEditing(true)} busy={confirming} />
      )}

      {isSpam && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] mt-3.5 pl-2 ml-2 select-none w-fit">
          <ShieldAlert size={13} className="shrink-0" />
          <span>Flagged as spam{badge ? ` (${badge.text.toLowerCase()})` : ""}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mt-4 pt-3 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50 pl-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) bg-(--color-brand-50) dark:bg-(--color-brand-900)/40 px-2 py-0.5 rounded-md">
            {source}
          </span>
          {badge && (
            <span title={badge.title} className="text-[10px] font-semibold text-(--color-muted) dark:text-(--color-muted-dark) ring-1 ring-(--color-border) dark:ring-(--color-border-dark) px-2 py-0.5 rounded-md">
              {badge.text}
            </span>
          )}
          {canCheck && !editing && !review.needsCheck && (
            <button type="button" onClick={() => setEditing(true)} aria-label="Edit labels" title="Edit labels"
              className="inline-flex items-center justify-center w-9 h-9 -my-2 rounded-lg text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-ink) dark:hover:text-white hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand-400)">
              <Pencil size={13} aria-hidden="true" />
            </button>
          )}
        </div>
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
