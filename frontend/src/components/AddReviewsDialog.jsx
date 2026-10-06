import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { Upload, Check, AlertCircle, Copy } from "lucide-react"
import Modal from "./ui/Modal"
import AnimatedTabs from "./fx/AnimatedTabs"
import { useProperty } from "../context/PropertyContext"
import { useAuth } from "../context/AuthContext"
import { MAX_IMPORT_ROWS, SOURCES, parseImport } from "../services/reviewImport"

const field = "w-full text-sm px-3 py-2.5 rounded-lg border border-(--color-border) dark:border-(--color-border-dark) bg-white dark:bg-(--color-surface-muted-dark) text-(--color-ink) dark:text-white focus:outline-none focus:ring-2 focus:ring-(--color-brand-500)/25 focus:border-(--color-brand-500)"
const label = "block text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark) mb-1"
const primary = "press inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-(--color-brand-600) hover:bg-(--color-brand-700) text-white text-sm font-semibold disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
// Who labelled the imported reviews, in plain words
const ENGINE = { model: "our AI model", llm: "Gemini", heuristic: "keyword rules", human: "you" }
const TEMPLATE = "Guest,Rating,Review,Date,Platform\nAsha,5,\"Spotless rooms and a lovely host.\",2026-09-14,Airbnb\nRavi,8,\"Great view, slow WiFi.\",14/09/2026,Booking.com\n"
const today = () => new Date().toISOString().slice(0, 10)

function OneReview({ property }) {
  const { addReview } = useProperty()
  const [form, setForm] = useState({ guest: "", rating: "5", date: today(), source: "Airbnb", text: "" })
  const [state, setState] = useState({ busy: false, done: null, error: null })
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const submit = async (e) => {
    e.preventDefault()
    setState({ busy: true, done: null, error: null })
    try {
      const r = await addReview({ propertyId: property.id, propertyName: property.name, guestName: form.guest.trim() || "Guest",
        rating: Number(form.rating), date: form.date, source: form.source, text: form.text.trim() })
      setState({ busy: false, done: r, error: null })
      setForm((f) => ({ ...f, guest: "", text: "" }))
    } catch (err) {
      setState({ busy: false, done: null, error: err.message || "Couldn't add the review" })
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label htmlFor="ar-guest" className={label}>Guest name</label>
          <input id="ar-guest" className={field} value={form.guest} onChange={set("guest")} placeholder="e.g. Asha" maxLength={120} /></div>
        <div><label htmlFor="ar-source" className={label}>Platform</label>
          <select id="ar-source" className={field} value={form.source} onChange={set("source")}>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select></div>
        <div><label htmlFor="ar-rating" className={label}>Rating</label>
          <select id="ar-rating" className={field} value={form.rating} onChange={set("rating")}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)} {n} star{n > 1 ? "s" : ""}</option>)}
          </select></div>
        <div><label htmlFor="ar-date" className={label}>Review date</label>
          <input id="ar-date" type="date" required className={field} value={form.date} max={today()} onChange={set("date")} /></div>
      </div>
      <div><label htmlFor="ar-text" className={label}>Review</label>
        <textarea id="ar-text" required rows={5} maxLength={5000} className={field} value={form.text} onChange={set("text")}
          placeholder="Paste the guest's review exactly as written" /></div>
      <div className="flex flex-wrap items-center gap-3" aria-live="polite">
        <button type="submit" className={primary} disabled={state.busy || !form.text.trim()}>{state.busy ? "Adding and analysing…" : "Add review"}</button>
        {state.done && (
          <span className="inline-flex items-center gap-1.5 text-sm text-emerald-700 dark:text-emerald-400">
            <Check size={16} aria-hidden="true" />
            {/* one text run: inside the flex row, separate pieces would each get the gap */}
            <span>Added: <span className="capitalize">{state.done.sentiment}</span>
              {state.done.labelSource && ENGINE[state.done.labelSource] ? `, labelled by ${ENGINE[state.done.labelSource]}` : ""}</span>
          </span>
        )}
        {state.error && <span className="inline-flex items-center gap-1.5 text-sm text-rose-700 dark:text-rose-400"><AlertCircle size={16} aria-hidden="true" /> {state.error}</span>}
      </div>
    </form>
  )
}

function ImportMany({ property }) {
  const { reviews, importReviews } = useProperty()
  const [text, setText] = useState("")
  const [defaultSource, setDefaultSource] = useState("Airbnb")
  const [run, setRun] = useState({ status: "idle", done: 0, total: 0, result: null })

  const existingTexts = useMemo(() => reviews.filter((r) => r.propertyId === property.id).map((r) => r.text), [reviews, property.id])
  const parsed = useMemo(() => (text.trim() ? parseImport(text, { defaultSource, existingTexts }) : null), [text, defaultSource, existingTexts])
  const ready = parsed?.rows.filter((r) => !r.errors.length && !r.duplicate) ?? []
  const duplicates = parsed?.rows.filter((r) => r.duplicate).length ?? 0
  const invalid = parsed?.rows.filter((r) => r.errors.length) ?? []

  const onFile = async (e) => {
    const file = e.target.files?.[0]
    if (file) setText(await file.text())
    e.target.value = ""
  }

  const start = async () => {
    setRun({ status: "running", done: 0, total: ready.length, result: null })
    const result = await importReviews(property.id, ready, (done) => setRun((r) => ({ ...r, done })))
    setRun({ status: "finished", done: ready.length, total: ready.length, result })
    if (!result.error) setText("")
  }

  if (run.status === "finished") {
    const { created, duplicates: skipped, failed, error } = run.result
    const engines = Object.entries(created.reduce((acc, r) => ({ ...acc, [r.labelSource]: (acc[r.labelSource] || 0) + 1 }), {}))
    return (
      <div className="space-y-4" aria-live="polite">
        <p className="flex items-center gap-2 text-base font-semibold text-(--color-ink) dark:text-white">
          <Check size={18} aria-hidden="true" className="text-emerald-600" /> Imported {created.length} review{created.length === 1 ? "" : "s"} into {property.name}
        </p>
        <ul className="text-sm space-y-1 text-(--color-muted) dark:text-(--color-muted-dark)">
          {engines.map(([engine, n]) => <li key={engine}>{n} labelled by {ENGINE[engine] || engine}</li>)}
          {skipped > 0 && <li>{skipped} skipped: already on this property</li>}
          {engines.some(([e]) => e === "heuristic") && <li>Reviews labelled by keyword rules are a rough guess: the AI wasn't available for them.</li>}
        </ul>
        {error && (
          <p className="text-sm text-rose-700 dark:text-rose-400">
            Stopped with {failed} review{failed === 1 ? "" : "s"} not imported ({error}). Run the same import again: reviews already imported are skipped.
          </p>
        )}
        <button type="button" className={primary} onClick={() => setRun({ status: "idle", done: 0, total: 0, result: null })}>Import more</button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
        Paste rows copied from a spreadsheet, or choose a CSV file. The first row must name the columns:
        <strong className="text-(--color-ink) dark:text-white"> Review, Rating, Date</strong>, and optionally Guest and Platform.
        Booking.com scores out of 10 are converted to stars.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <label className="press inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-(--color-border) dark:border-(--color-border-dark) text-sm font-semibold text-(--color-ink) dark:text-white cursor-pointer hover:border-(--color-brand-500) focus-within:ring-2 focus-within:ring-(--color-brand-500)/30">
          <Upload size={15} aria-hidden="true" /> Choose CSV file
          <input type="file" accept=".csv,.tsv,.txt,text/csv" className="sr-only" onChange={onFile} />
        </label>
        <a href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE)}`} download="revlens-reviews-template.csv"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300) underline underline-offset-4 decoration-(--color-brand-600)/30 hover:decoration-current">
          <Copy size={14} aria-hidden="true" /> Download a template
        </a>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="imp-source" className="whitespace-nowrap text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Platform if not given</label>
          <select id="imp-source" className={`${field} w-auto py-1.5`} value={defaultSource} onChange={(e) => setDefaultSource(e.target.value)}>
            {SOURCES.map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor="imp-text" className={label}>Rows to import</label>
        <textarea id="imp-text" rows={6} className={`${field} font-mono text-xs`} value={text} onChange={(e) => setText(e.target.value)}
          placeholder={"Guest\tRating\tReview\tDate\tPlatform\nAsha\t5\tSpotless rooms and a lovely host.\t2026-09-14\tAirbnb"} />
      </div>

      {parsed?.error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-400">{parsed.error}</p>}

      {parsed && !parsed.error && (
        <div className="space-y-3">
          <p className="text-sm text-(--color-ink) dark:text-white" aria-live="polite">
            <strong>{ready.length} ready</strong>
            {duplicates > 0 && <span className="text-(--color-muted) dark:text-(--color-muted-dark)"> · {duplicates} already imported</span>}
            {invalid.length > 0 && <span className="text-rose-700 dark:text-rose-400"> · {invalid.length} need fixing (left out)</span>}
          </p>
          {/* focusable so keyboard users can scroll the preview too */}
          <div tabIndex={0} role="region" aria-label="Preview of the rows to import"
            className="max-h-56 overflow-auto rounded-lg border border-(--color-border) dark:border-(--color-border-dark) focus-visible:outline-2 focus-visible:outline-(--color-brand-500)">
            <table className="w-full text-xs">
              <caption className="sr-only">Preview of the rows to import</caption>
              <thead className="sticky top-0 bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) text-left">
                <tr>{["Row", "Guest", "Stars", "Date", "Platform", "Review", "Status"].map((h) => <th key={h} scope="col" className="px-2.5 py-2 font-semibold">{h}</th>)}</tr>
              </thead>
              <tbody>
                {parsed.rows.slice(0, 100).map((r) => (
                  <tr key={r.line} className="border-t border-(--color-border) dark:border-(--color-border-dark) align-top">
                    <td className="px-2.5 py-1.5 tabular-nums text-(--color-muted) dark:text-(--color-muted-dark)">{r.line}</td>
                    <td className="px-2.5 py-1.5">{r.guest}</td>
                    <td className="px-2.5 py-1.5 tabular-nums">{r.rating ?? "–"}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap tabular-nums">{r.date ?? "–"}</td>
                    <td className="px-2.5 py-1.5">{r.source}</td>
                    <td className="px-2.5 py-1.5 max-w-[16rem]"><span className="line-clamp-2">{r.text}</span></td>
                    <td className="px-2.5 py-1.5">
                      {r.errors.length ? <span className="text-rose-700 dark:text-rose-400">{r.errors.join("; ")}</span>
                        : r.duplicate ? <span className="text-(--color-muted) dark:text-(--color-muted-dark)">Duplicate</span>
                          : <span className="text-emerald-700 dark:text-emerald-400">Ready</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.rows.length > 100 && <p className="px-2.5 py-2 text-xs text-(--color-muted) dark:text-(--color-muted-dark)">Showing the first 100 of {parsed.rows.length} rows.</p>}
          </div>
        </div>
      )}

      {run.status === "running" ? (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-(--color-ink) dark:text-white" id="imp-progress-label">Importing and analysing {run.done} of {run.total}…</p>
          <div role="progressbar" aria-labelledby="imp-progress-label" aria-valuemin={0} aria-valuemax={run.total} aria-valuenow={run.done}
            className="h-2 rounded-full bg-(--color-border) dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-(--color-brand-600) transition-[width] duration-300" style={{ width: `${run.total ? (run.done / run.total) * 100 : 0}%` }} />
          </div>
        </div>
      ) : (
        <button type="button" className={primary} disabled={!ready.length} onClick={start}>
          {ready.length ? `Import ${ready.length} review${ready.length === 1 ? "" : "s"}` : "Import"}
        </button>
      )}
      <p className="text-xs text-(--color-muted) dark:text-(--color-muted-dark)">Up to {MAX_IMPORT_ROWS} rows at a time. Each review is analysed as it's imported.</p>
    </div>
  )
}

export default function AddReviewsDialog({ isOpen, onClose }) {
  const { properties, selectedPropertyId } = useProperty()
  const { user } = useAuth()
  // Reviews can only be added to the host's own properties (shared demo properties are read-only)
  const owned = properties.filter((p) => p.userId === user?.id)
  const [propertyId, setPropertyId] = useState(null)
  const [tab, setTab] = useState("one")
  const chosen = owned.find((p) => p.id === propertyId) || owned.find((p) => String(p.id) === selectedPropertyId) || owned[0]

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add reviews" size="xl">
      {owned.length === 0 ? (
        <div className="space-y-3">
          <p>Reviews belong to a property, and you haven&rsquo;t added one yet. The sample properties are read-only.</p>
          <Link to="/dashboard/properties" onClick={onClose} className={primary}>Add your property</Link>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-[14rem]">
              <label htmlFor="ar-property" className={label}>Property</label>
              <select id="ar-property" className={field} value={chosen.id} onChange={(e) => setPropertyId(Number(e.target.value))}>
                {owned.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.location}</option>)}
              </select>
            </div>
            <AnimatedTabs label="How to add reviews" idPrefix="add-reviews" value={tab} onChange={setTab}
              tabs={[{ value: "one", label: "One review" }, { value: "many", label: "Import many" }]} />
          </div>
          <div role="tabpanel" aria-labelledby={`add-reviews-${tab}`}>
            {tab === "one" ? <OneReview key={chosen.id} property={chosen} /> : <ImportMany key={chosen.id} property={chosen} />}
          </div>
        </div>
      )}
    </Modal>
  )
}
