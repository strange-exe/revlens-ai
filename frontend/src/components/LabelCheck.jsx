import { useState } from "react"
import { Check, Pencil } from "lucide-react"
import Button from "./ui/Button"
import { ASPECT_SHORT } from "../services/reviewMetrics"

const SENTIMENTS = ["positive", "neutral", "negative"]
const CHOICES = [
  { value: "positive", text: "+", word: "positive" },
  { value: "negative", text: "−", word: "negative" },
  { value: null, text: "None", word: "not mentioned" },
]
const ON = {
  positive: "bg-emerald-600 text-white border-emerald-600",
  negative: "bg-rose-600 text-white border-rose-600",
  neutral: "bg-(--color-ink) text-white border-(--color-ink) dark:bg-white dark:text-(--color-ink) dark:border-white",
  none: "bg-(--color-ink) text-white border-(--color-ink) dark:bg-white dark:text-(--color-ink) dark:border-white",
}
const OFF = "bg-transparent text-(--color-ink) dark:text-white/85 border-(--color-border) dark:border-(--color-border-dark) hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark)"
const chip = "min-h-[36px] px-3 rounded-lg border text-xs font-semibold transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-(--color-brand-400)"

/** "Is this label right?": a one-line question on reviews the model was unsure about, and the editor that
 *  lets the host correct sentiment and aspects. Saving sends the full set of labels the host considers right. */
export function LabelQuestion({ review, onConfirm, onFix, busy }) {
  const why = review.labelSource === "heuristic" ? "These labels are a keyword guess." : "The AI model wasn't sure."
  return (
    <div className="mt-3 ml-2 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-dashed border-(--color-border) dark:border-(--color-border-dark) px-3 py-2">
      <p className="text-xs text-(--color-ink) dark:text-white/85 mr-auto">
        <span className="font-semibold">Are these labels right?</span>{" "}
        <span className="text-(--color-muted) dark:text-(--color-muted-dark)">{why}</span>
      </p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" icon={<Check size={13} />} onClick={onConfirm} isLoading={busy}
          className="rounded-lg">Yes</Button>
        <Button size="sm" variant="ghost" icon={<Pencil size={13} />} onClick={onFix} disabled={busy}
          className="rounded-lg text-(--color-ink) dark:text-white">Fix</Button>
      </div>
    </div>
  )
}

export function LabelEditor({ review, onSave, onCancel }) {
  const [sentiment, setSentiment] = useState(review.sentiment)
  const [aspects, setAspects] = useState(() => ({ ...(review.aspects || {}) }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  const setAspect = (key, value) => setAspects((prev) => {
    const next = { ...prev }
    if (value) next[key] = value
    else delete next[key]
    return next
  })

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await onSave({ sentiment, aspects })
    } catch (err) {
      setError(err.message || "Couldn't save. Try again.")
      setSaving(false)
    }
  }

  return (
    <div className="mt-3 ml-2 rounded-xl border border-(--color-border) dark:border-(--color-border-dark) p-3 sm:p-4 space-y-4">
      <fieldset>
        <legend className="text-xs font-semibold text-(--color-ink) dark:text-white mb-2">Overall feeling</legend>
        <div className="flex flex-wrap gap-2">
          {SENTIMENTS.map((s) => (
            <button key={s} type="button" aria-pressed={sentiment === s} onClick={() => setSentiment(s)}
              className={`${chip} capitalize ${sentiment === s ? ON[s] : OFF}`}>{s}</button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-xs font-semibold text-(--color-ink) dark:text-white mb-1">What the guest says about each aspect</legend>
        <p className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark) mb-2">+ praised, − complained about, None not mentioned</p>
        <ul className="space-y-1.5">
          {Object.entries(ASPECT_SHORT).map(([key, name]) => (
            <li key={key} className="flex items-center justify-between gap-3">
              <span className="text-xs text-(--color-ink) dark:text-white/85">{name}</span>
              <span className="flex gap-1" role="group" aria-label={name}>
                {CHOICES.map((c) => {
                  const on = (aspects[key] ?? null) === c.value
                  return (
                    <button key={c.word} type="button" aria-pressed={on} aria-label={`${name}: ${c.word}`}
                      onClick={() => setAspect(key, c.value)}
                      className={`${chip} ${c.value ? "w-10 px-0 text-sm" : "w-14 px-0"} ${on ? ON[c.value ?? "none"] : OFF}`}>
                      {c.text}
                    </button>
                  )
                })}
              </span>
            </li>
          ))}
        </ul>
      </fieldset>

      {error && <p role="alert" className="text-xs text-rose-700 dark:text-rose-400">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving} className="rounded-lg">Cancel</Button>
        <Button size="sm" onClick={save} isLoading={saving} className="rounded-lg">Save labels</Button>
      </div>
    </div>
  )
}
