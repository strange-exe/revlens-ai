import { useEffect, useState } from "react"
import { AlertTriangle, X } from "lucide-react"
import { api } from "../services/api"

const REFRESH_MS = 5 * 60 * 1000

/** Tells the host when AI is offline, so keyword guesses and template replies are never mistaken for AI output. */
export default function AiStatusBanner() {
  const [status, setStatus] = useState(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => api.getAiStatus().then((s) => !cancelled && setStatus(s)).catch(() => {})
    load()
    const timer = setInterval(load, REFRESH_MS)
    return () => { cancelled = true; clearInterval(timer) }
  }, [])

  if (!status || status.classifier !== "heuristic" || dismissed) return null

  return (
    <div role="status" className="flex items-start gap-3 mb-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-300 text-xs leading-relaxed">
      <AlertTriangle size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <p className="flex-1">
        <strong>AI is currently unavailable.</strong> New reviews are labelled by simple keyword rules (marked
        &ldquo;Keyword guess&rdquo;) and reply drafts use generic templates. Check those before relying on them.
      </p>
      <button type="button" onClick={() => setDismissed(true)} aria-label="Dismiss notice"
        className="p-1 rounded-md hover:bg-amber-500/20 focus-visible:outline-2 focus-visible:outline-amber-500">
        <X size={14} />
      </button>
    </div>
  )
}
