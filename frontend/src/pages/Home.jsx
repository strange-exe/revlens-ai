import { Link } from "react-router-dom"
import { ArrowRight } from "lucide-react"
import Hero from "../components/Hero"
import ReviewShowcase from "../components/ReviewShowcase"
import SectionHead from "../components/SectionHead"

const steps = [
  { title: "Add your reviews", desc: "Paste in reviews from Airbnb, Booking.com, Google, TripAdvisor, MakeMyTrip, Agoda or anywhere else, per property." },
  { title: "RevLens reads them", desc: "Each review gets a sentiment, a spam check and a verdict on six aspects. Every label says which engine produced it." },
  { title: "You act on what matters", desc: "See which problems keep coming up, ask questions in plain language, and send replies you have edited." },
]

// Small, true-to-product visuals (sample data)
const bar = (label, pct, color) => (
  <div key={label} className="flex items-center gap-3 text-xs text-(--color-muted) dark:text-(--color-muted-dark)">
    <span className="w-16 shrink-0">{label}</span>
    <span className="flex-1 h-1.5 rounded-full bg-(--color-border) dark:bg-white/10 overflow-hidden"><span className={`block h-full ${color}`} style={{ width: `${pct}%` }} /></span>
    <span className="w-9 text-right tabular-nums font-semibold text-(--color-ink) dark:text-white">{pct}%</span>
  </div>
)
const aspect = (name, good) => (
  <span key={name} className={`text-sm font-semibold ${good ? "text-emerald-700 dark:text-emerald-400" : "text-rose-700 dark:text-rose-400"}`}>{name} {good ? "+" : "−"}</span>
)

const features = [
  {
    title: "Sentiment and spam, labelled",
    desc: "Positive, neutral or negative for every review. Spam is held back so it can't skew your numbers.",
    visual: <div className="space-y-2.5">{bar("Positive", 72, "bg-emerald-500")}{bar("Neutral", 18, "bg-amber-400")}{bar("Negative", 10, "bg-rose-500")}</div>,
  },
  {
    title: "Six aspects, not one score",
    desc: "Cleanliness, location, WiFi, hosting, value and amenities, judged review by review.",
    visual: <div className="flex flex-wrap gap-x-5 gap-y-2">{aspect("Cleanliness", true)}{aspect("WiFi", false)}{aspect("Location", true)}{aspect("Value", false)}{aspect("Host", true)}</div>,
  },
  {
    title: "Reply drafts you control",
    desc: "One click drafts a reply to what the guest actually wrote. You edit it, then copy it to the platform.",
    visual: <p className="text-sm leading-relaxed text-(--color-ink) dark:text-white border-l-2 border-(--color-brand-500) pl-3">&ldquo;Thank you! We&rsquo;re sorry about the WiFi and are upgrading the router.&rdquo;</p>,
  },
  {
    title: "Ask your reviews",
    desc: "Answers come only from your reviews and list the ones they used, so you can check them.",
    visual: (
      <div className="text-sm leading-relaxed">
        <p className="font-semibold text-(--color-ink) dark:text-white">What do guests complain about most?</p>
        <p className="mt-1 text-(--color-muted) dark:text-(--color-muted-dark)">The access road and slow WiFi, in 3 of 12 reviews. <span className="text-(--color-brand-600) dark:text-(--color-brand-300) font-semibold">Sources: Vikram, Rahul, Karan</span></p>
      </div>
    ),
  },
]

// Verifiable facts about how RevLens is built and evaluated (see ml/DATASETS.md)
const facts = [
  { value: "6", label: "guest-experience aspects tracked in every review" },
  { value: "40k", label: "hotel reviews in the frozen test set we evaluate on" },
  { value: "4", label: "label sources, always shown: AI model, LLM, keyword rule, or you" },
]

export default function Home() {
  return (
    <>
      <Hero />

      <section className="border-t border-(--color-border) dark:border-(--color-border-dark) py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead label="How it works" title="From a pile of reviews to a short list of fixes" />
          <ol className="grid md:grid-cols-3 gap-10 md:gap-8">
            {steps.map((s, i) => (
              <li key={s.title} className="reveal-up border-t-2 border-(--color-ink) dark:border-white pt-5">
                <span className="font-heading text-sm font-bold tabular-nums text-(--color-brand-600) dark:text-(--color-brand-300)">0{i + 1}</span>
                <h3 className="mt-2 text-lg font-semibold text-(--color-ink) dark:text-white">{s.title}</h3>
                <p className="mt-2 text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">{s.desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) border-y border-(--color-border) dark:border-(--color-border-dark)">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead label="What you get" title="Less reading, clearer decisions">
            Every feature works on the reviews you add. Nothing is sent to a guest without you.
          </SectionHead>
          <div className="grid md:grid-cols-2 gap-x-16">
            {features.map((f) => (
              <article key={f.title} className="reveal-up grid sm:grid-cols-2 gap-6 py-8 border-t border-(--color-border) dark:border-(--color-border-dark)">
                <div>
                  <h3 className="text-lg font-semibold text-(--color-ink) dark:text-white">{f.title}</h3>
                  <p className="mt-2 text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">{f.desc}</p>
                </div>
                <div className="self-center">{f.visual}</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-(--color-ink) text-white dark:bg-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_2fr] gap-12">
          <div>
            <p className="text-sm font-semibold text-white/70">Built to be checked</p>
            <h2 className="mt-2 font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight">AI you can audit, not just trust</h2>
            <p className="mt-4 text-base leading-relaxed text-white/75 max-w-sm">
              When the AI is offline, RevLens says so instead of guessing. You can overrule any label.
            </p>
          </div>
          <dl className="grid sm:grid-cols-3 gap-8">
            {facts.map((f) => (
              <div key={f.label} className="reveal-up border-t border-white/25 pt-5 flex flex-col-reverse justify-end">
                <dt className="mt-3 text-sm leading-relaxed text-white/75">{f.label}</dt>
                <dd className="font-heading text-5xl lg:text-6xl font-bold tracking-tight tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <ReviewShowcase />

      <section className="border-t border-(--color-border) dark:border-(--color-border-dark) py-20 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end md:justify-between gap-8">
          <div className="max-w-xl">
            <h2 className="font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight text-(--color-ink) dark:text-white">
              Start with the reviews you already have.
            </h2>
            <p className="mt-3 text-base text-(--color-muted) dark:text-(--color-muted-dark)">
              Free during the beta. No card needed.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login?mode=signup" className="press group inline-flex items-center gap-2 px-6 py-3.5 rounded-lg bg-(--color-brand-600) text-white font-semibold hover:bg-(--color-brand-700) transition-colors">
              Start free <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link to="/pricing" className="text-sm font-semibold text-(--color-ink) dark:text-white underline decoration-(--color-border) dark:decoration-white/30 underline-offset-4 hover:decoration-current">
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
