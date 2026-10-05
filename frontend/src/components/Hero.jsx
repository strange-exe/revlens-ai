import { Link } from "react-router-dom"
import { ArrowRight, ArrowDown, Star } from "lucide-react"

// A real demo review with the labels Gemini produced for it (see ReviewShowcase), marked up the way RevLens reads it.
function Note({ tone, children }) {
  return (
    <sup className={`ml-1 whitespace-nowrap text-[11px] font-semibold not-italic tracking-wide ${tone === "pos" ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>
      {children}
    </sup>
  )
}

export function ReviewSpecimen({ compact = false }) {
  return (
    <figure className="relative rounded-xl bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) shadow-[0_1px_0_rgb(0_0_0/0.04),0_24px_48px_-24px_rgb(25_23_31/0.25)]">
      <figcaption className="flex items-center justify-between gap-3 px-5 sm:px-6 py-3.5 border-b border-(--color-border) dark:border-(--color-border-dark) text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
        <span><span className="font-semibold text-(--color-ink) dark:text-white">Rahul</span> · Sunset Villa · sample review</span>
        <span className="flex gap-0.5" role="img" aria-label="4 out of 5 stars">
          {Array.from({ length: 5 }, (_, i) => <Star key={i} size={12} aria-hidden="true" className={i < 4 ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-white/20"} />)}
        </span>
      </figcaption>

      <blockquote className="px-5 sm:px-6 pt-5 pb-6 text-lg leading-[1.9] text-(--color-ink) dark:text-white">
        Great stay overall. <mark className="mark mark-pos">The pool was clean<Note tone="pos">Cleanliness +</Note></mark> and{" "}
        <mark className="mark mark-pos">the staff was friendly<Note tone="pos">Host +</Note></mark>.{" "}
        <mark className="mark mark-neg">Could improve the WiFi speed<Note tone="neg">WiFi −</Note></mark> though.
      </blockquote>

      <dl className="grid grid-cols-3 border-t border-(--color-border) dark:border-(--color-border-dark) text-xs">
        {[["Sentiment", "Positive"], ["Spam", "No"], ["Labelled by", "LLM"]].map(([k, v]) => (
          <div key={k} className="px-5 sm:px-6 py-3 border-r last:border-r-0 border-(--color-border) dark:border-(--color-border-dark)">
            <dt className="text-(--color-muted) dark:text-(--color-muted-dark)">{k}</dt>
            <dd className="mt-0.5 font-semibold text-(--color-ink) dark:text-white">{v}</dd>
          </div>
        ))}
      </dl>

      {!compact && <div className="px-5 sm:px-6 py-4 border-t border-(--color-border) dark:border-(--color-border-dark) bg-(--color-surface-muted)/60 dark:bg-white/[0.03] rounded-b-xl">
        <p className="text-xs font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">Draft reply · you edit before sending</p>
        <p className="mt-1.5 text-sm leading-relaxed text-(--color-ink)/80 dark:text-white/80">
          Thank you, Rahul! We&rsquo;re glad you enjoyed the pool and our team. You&rsquo;re right about the WiFi, and we&rsquo;re looking at a faster connection.
        </p>
      </div>}
    </figure>
  )
}

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.2fr_1fr] gap-12 lg:gap-14 items-center">
        <div>
          <p className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">
            For homestay and small-hotel hosts
          </p>
          <h1 className="mt-4 font-heading text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[3.6rem] xl:text-[4rem] font-bold tracking-[-0.035em] text-(--color-ink) dark:text-white text-balance">
            Know what guests love, and what to fix.
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-xl text-pretty">
            RevLens reads the reviews you get on Airbnb, Booking.com, Google and other sites. It marks what each guest
            praised or disliked across six aspects, holds back spam, and drafts replies for you to edit, so you can fix
            recurring problems without reading every review.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link
              to="/login?mode=signup"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-(--color-brand-600) text-white text-base font-semibold hover:bg-(--color-brand-700) transition-colors shadow-[0_8px_24px_-8px_rgb(124_58_237/0.6)]"
            >
              Start free
              <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#example" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-(--color-ink) dark:text-white underline decoration-(--color-border) dark:decoration-white/30 underline-offset-4 hover:decoration-current">
              See more labelled reviews <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
          <p className="mt-4 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">
            Free during the beta. No card needed.
          </p>
        </div>

        <ReviewSpecimen />
      </div>
    </section>
  )
}
