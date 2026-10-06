import { useEffect, useRef, useState } from "react"
import { Star, ShieldAlert } from "lucide-react"
import AnimatedTabs from "./fx/AnimatedTabs"

// Demo reviews with the labels Gemini actually gave them (same data as ReviewShowcase).
// Highlights mark the words behind each label; the draft replies are examples, shown as such.
const SAMPLES = [
  { id: "rahul", guest: "Rahul", property: "Sunset Villa", rating: 4, sentiment: "Positive", spam: false,
    parts: ["Great stay overall. ", ["The pool was clean", "pos", "Cleanliness +"], " and ", ["the staff was friendly", "pos", "Host +"],
      ". ", ["Could improve the WiFi speed", "neg", "WiFi −"], " though."],
    draft: "Thank you, Rahul! We're glad you enjoyed the pool and our team. You're right about the WiFi, and we're looking at a faster connection." },
  { id: "vikram", guest: "Vikram", property: "Lakeview Cottage", rating: 3, sentiment: "Neutral", spam: false,
    parts: ["Decent place but ", ["the road leading to the property is in bad condition", "neg", "Location −"], ". ",
      ["The rooms were clean and comfortable", "pos", "Cleanliness +"], "."],
    draft: "Thank you, Vikram. We're glad the rooms were comfortable, and sorry about the road. We'll add clearer directions to our listing." },
  { id: "karan", guest: "Karan", property: "Lakeview Cottage", rating: 1, sentiment: "Negative", spam: false,
    parts: [["Not worth the price", "neg", "Value −"], ". ", ["The lake was far from the property despite the name", "neg", "Location −"],
      ". Breakfast options were very limited."],
    draft: "Karan, thank you for the honest feedback. We're sorry the stay didn't feel like good value, and we'll make the distance to the lake clear." },
  { id: "spam", guest: "TravelDealsBot", property: "Sunset Villa", rating: 1, sentiment: "n/a", spam: true,
    parts: ["AMAZING DISCOUNTS! Get 50% off homestays and hotels by ", ["clicking here: http://promo-hotels-spam.ru/discount", "neg", "Spam"]],
    draft: null },
]
const STEP = 0.45 // seconds between highlights

// The example reply appears word by word once the highlights have drawn. Pure CSS (staggered delays):
// no re-render per character, so it stays smooth while scrolling on slow phones.
function DraftReveal({ text, delay }) {
  return (
    <p className="mt-1.5 text-sm leading-relaxed text-(--color-ink)/80 dark:text-white/80" style={{ "--d": `${delay}s` }}>
      {text.split(" ").map((word, i) => <span key={i} className="demo-word" style={{ "--w": i }}>{word} </span>)}
    </p>
  )
}

function Specimen({ sample, compact }) {
  const marks = sample.parts.filter(Array.isArray).length
  const done = marks * STEP + 0.6
  return (
    <>
      <blockquote className={`px-5 sm:px-6 pt-5 pb-6 text-lg leading-[1.9] text-(--color-ink) dark:text-white ${sample.spam ? "opacity-80" : ""}`}>
        {sample.parts.map((p, k) => {
          if (!Array.isArray(p)) return <span key={k}>{p}</span>
          const [text, tone, note] = p
          const i = sample.parts.slice(0, k).filter(Array.isArray).length // order of this highlight
          return (
            <mark key={k} className={`mark mark-${tone}`} style={{ "--i": i }}>
              {text}
              <sup className={`ml-1 whitespace-nowrap text-[11px] font-semibold tracking-wide ${tone === "pos" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{note}</sup>
            </mark>
          )
        })}
      </blockquote>

      <dl className="grid grid-cols-3 border-t border-(--color-border) dark:border-(--color-border-dark) text-xs">
        {[["Sentiment", sample.sentiment], ["Spam", sample.spam ? "Yes, held back" : "No"], ["Labelled by", "LLM"]].map(([k, v]) => (
          <div key={k} className="px-5 sm:px-6 py-3 border-r last:border-r-0 border-(--color-border) dark:border-(--color-border-dark)">
            <dt className="text-(--color-muted) dark:text-(--color-muted-dark)">{k}</dt>
            <dd className="demo-fade mt-0.5 font-semibold text-(--color-ink) dark:text-white" style={{ "--d": `${done}s` }}>{v}</dd>
          </div>
        ))}
      </dl>

      {!compact && (
        <div className="px-5 sm:px-6 py-4 border-t border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface-muted)/60 dark:bg-white/[0.03] rounded-b-xl">
          {sample.draft ? (
            <>
              <p className="text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">Example draft reply · you edit before sending</p>
              <DraftReveal text={sample.draft} delay={done} />
            </>
          ) : (
            <p className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-400 min-h-[4.5em]">
              <ShieldAlert size={16} aria-hidden="true" /> Spam is kept out of your stats. No reply needed.
            </p>
          )}
        </div>
      )}
    </>
  )
}

export default function ReviewDemo({ compact = false }) {
  const [id, setId] = useState(SAMPLES[0].id)
  // No IntersectionObserver (very old browsers): just play
  const [play, setPlay] = useState(() => typeof IntersectionObserver === "undefined")
  const ref = useRef(null)
  const sample = SAMPLES.find((s) => s.id === id)

  // Start the animation only once the card is actually on screen (it's below the fold on phones)
  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === "undefined") return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setPlay(true); io.disconnect() } }, { threshold: 0.35 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="space-y-3">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Try a sample review</p>
          <AnimatedTabs label="Sample reviews" idPrefix="demo" value={id} onChange={setId}
            tabs={SAMPLES.map((s) => ({ value: s.id, label: s.spam ? "Spam" : s.guest }))} />
        </div>
      )}
      <figure ref={ref} data-play={play || undefined} role={compact ? undefined : "tabpanel"} aria-labelledby={compact ? undefined : `demo-${id}`}
        className="demo relative rounded-xl bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) shadow-[0_1px_0_rgb(0_0_0/0.04),0_24px_48px_-24px_rgb(25_23_31/0.25)]">
        <figcaption className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-(--color-border) dark:border-(--color-border-dark) text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
          <span><span className="font-semibold text-(--color-ink) dark:text-white">{sample.guest}</span> · {sample.property}</span>
          <span className="flex gap-0.5" role="img" aria-label={`${sample.rating} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} aria-hidden="true" className={i < sample.rating ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-white/20"} />)}
          </span>
        </figcaption>
        {/* keyed by sample: switching remounts it, which replays the CSS animations and resets the typing */}
        <Specimen key={id} sample={sample} compact={compact} />
      </figure>
    </div>
  )
}
