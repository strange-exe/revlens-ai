import { Star, ShieldAlert } from "lucide-react"
import { ASPECT_SHORT } from "../services/reviewMetrics"

// RevLens demo reviews with the labels the deployed model gives them (deberta-v3-xsmall-s13-food2-u8, 2026-10-10).
// Copied from its output unchanged, including its misses (Karan's 1-star review reads "neutral" to it).
// Re-run them when the model changes. Shown as a product demo, never as customer testimonials.
const samples = [
  { id: 4, guest: "Vikram", property: "Lakeview Cottage", rating: 3, sentiment: "neutral",
    text: "Decent place but the road leading to the property is in bad condition. The rooms were clean and comfortable.",
    aspects: { cleanliness: "positive", location: "negative", amenities: "positive" } },
  { id: 8, guest: "Karan", property: "Lakeview Cottage", rating: 1, sentiment: "neutral",
    text: "Not worth the price. The lake was far from the property despite the name. Breakfast options were very limited.",
    aspects: { location: "negative", value: "negative", amenities: "negative", food: "negative" } },
  { id: 11, guest: "TravelDealsBot", property: "Sunset Villa", rating: 1, sentiment: "positive", spam: true,
    text: "AMAZING DISCOUNTS! Get 50% off homestays and hotels by clicking here: http://promo-hotels-spam.ru/discount",
    aspects: {} },
]

const SENTIMENT_TEXT = {
  positive: "text-emerald-700 dark:text-emerald-400",
  neutral: "text-amber-700 dark:text-amber-400",
  negative: "text-rose-700 dark:text-rose-400",
}

function Sample({ review }) {
  return (
    <article className="reveal-up flex flex-col py-8 md:px-8 md:first:pl-0 md:last:pr-0 border-t md:border-t-0 md:border-l md:first:border-l-0 border-(--color-border) dark:border-(--color-border-dark)">
      <header className="flex items-baseline justify-between gap-3">
        <p className="text-sm"><span className="font-semibold text-(--color-ink) dark:text-white">{review.guest}</span>
          <span className="text-(--color-muted) dark:text-(--color-muted-dark)"> · {review.property}</span></p>
        <span className="flex gap-0.5 shrink-0" role="img" aria-label={`${review.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} size={12} aria-hidden="true" className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-white/20"} />
          ))}
        </span>
      </header>
      <p className={`mt-4 text-base leading-relaxed flex-1 ${review.spam ? "text-(--color-muted) dark:text-(--color-muted-dark) line-through decoration-rose-500/60" : "text-(--color-ink) dark:text-white"}`}>
        &ldquo;{review.text}&rdquo;
      </p>
      <p className="mt-5 pt-4 border-t border-dashed border-(--color-border) dark:border-(--color-border-dark) flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
        {review.spam ? (
          <span className="inline-flex items-center gap-1.5 text-rose-700 dark:text-rose-400"><ShieldAlert size={15} aria-hidden="true" /> Spam: kept out of your stats</span>
        ) : (
          <>
            <span className={`capitalize ${SENTIMENT_TEXT[review.sentiment]}`}>{review.sentiment}</span>
            {Object.entries(review.aspects).map(([name, polarity]) => (
              <span key={name} className={SENTIMENT_TEXT[polarity]}>{ASPECT_SHORT[name]} {polarity === "positive" ? "+" : "−"}</span>
            ))}
          </>
        )}
      </p>
    </article>
  )
}

export default function ReviewShowcase() {
  return (
    <section id="example" className="scroll-mt-20 py-20 lg:py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">Examples</p>
        <h2 className="mt-2 font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight text-(--color-ink) dark:text-white max-w-2xl text-balance">
          The mixed reviews are the useful ones
        </h2>
        <p className="mt-3 text-base text-(--color-muted) dark:text-(--color-muted-dark) max-w-xl">
          Demo reviews with the labels RevLens&rsquo;s AI gave them. A three-star review can still tell you the rooms are fine and the road is not.
        </p>
        <div className="mt-10 grid md:grid-cols-3">
          {samples.map((r) => <Sample key={r.id} review={r} />)}
        </div>
      </div>
    </section>
  )
}
