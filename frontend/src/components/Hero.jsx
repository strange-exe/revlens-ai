import { Link } from "react-router-dom"
import { ArrowRight, ArrowDown } from "lucide-react"
import ReviewDemo from "./ReviewDemo"

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 sm:pt-32 lg:pt-36 lg:pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-14 items-center">
        <div>
          <p className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">
            For homestay and small-hotel hosts
          </p>
          <h1 className="mt-4 font-heading text-[2.5rem] leading-[1.04] sm:text-6xl lg:text-[2.625rem] xl:text-5xl font-bold tracking-[-0.035em] text-(--color-ink) dark:text-white text-balance lg:text-wrap">
            {/* Two lines on desktop, breaking at the comma; wraps naturally on small screens */}
            Know what guests love, <span className="lg:block">and what to fix.</span>
          </h1>
          <p className="mt-6 text-base sm:text-lg leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-xl text-pretty">
            RevLens marks what guests praised or disliked in your Airbnb, Booking.com and Google reviews, flags spam,
            and drafts replies.
          </p>

          <div className="mt-9 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link
              to="/login?mode=signup"
              className="press group inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-(--color-brand-600) text-white text-base font-semibold hover:bg-(--color-brand-700) transition-colors shadow-[0_1px_2px_rgb(25_23_31/0.16)]"
            >
              Start free
              <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a href="#example" className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-(--color-ink) dark:text-white underline decoration-(--color-border) dark:decoration-white/30 underline-offset-4 hover:decoration-current">
              See more labelled reviews <ArrowDown size={15} aria-hidden="true" />
            </a>
          </div>
        </div>

        <ReviewDemo />
      </div>
    </section>
  )
}
