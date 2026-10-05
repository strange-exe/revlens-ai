import { Link } from "react-router-dom"
import { ArrowRight, Check, Plus } from "lucide-react"
import SectionHead from "../components/SectionHead"

// Only what the app does today. There is no billing yet: paid plans are shown as planned, with no feature promises.
const BETA_FEATURES = [
  "Unlimited properties and reviews during the beta",
  "Sentiment and spam labels, with the source of every label",
  "Six aspects per review, from cleanliness to WiFi",
  "Reply drafts you edit before sending",
  "Ask questions about your reviews, with cited answers",
  "Analytics across properties and time periods",
]

const plans = [
  { name: "Beta", price: "Free", period: "", status: "Available now",
    description: "Everything RevLens does today, for any number of properties.",
    features: BETA_FEATURES, cta: { to: "/login?mode=signup", label: "Start free" } },
  { name: "Professional", price: "₹1,499", period: "/month", status: "Planned",
    description: "For hosts running several properties, once the beta ends." },
  { name: "Enterprise", price: "Custom", period: "", status: "Planned",
    description: "For chains and agencies with large portfolios." },
]

const faqs = [
  { q: "Is RevLens free?",
    a: "Yes. During the beta every feature is free and needs no card. The paid plans on this page are planned and can't be bought yet. We'll announce pricing before anything changes." },
  { q: "Which review platforms are supported?",
    a: "You can add reviews from any platform, such as Airbnb, Booking.com, Google, TripAdvisor or MakeMyTrip, and tag where each came from. RevLens doesn't connect to those platforms automatically yet." },
  { q: "How accurate is the AI sentiment analysis?",
    a: "We measure it on a frozen test set of about 40,000 hotel reviews, including where the model goes wrong, rather than quoting a single headline number. Every label in the app also shows whether it came from the AI model, an LLM, a keyword rule, or you." },
  { q: "What happens to my reviews?",
    a: "They're stored in your account. To label them, draft replies and answer questions, review text is sent to Google's Gemini API (and, once deployed, to our own model). Nothing is posted or sent to a guest without you." },
]

export default function Pricing() {
  return (
    <>
      <section className="pt-32 pb-14 lg:pt-36">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">Pricing</p>
          <h1 className="mt-3 font-heading text-[2.5rem] leading-[1.05] sm:text-6xl font-bold tracking-[-0.035em] text-(--color-ink) dark:text-white max-w-3xl text-balance">
            Free while we&rsquo;re in beta.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-2xl">
            Every feature is free today, with no card and no limits on properties or reviews. Paid plans come later, and
            we&rsquo;ll tell you before anything changes.
          </p>
        </div>
      </section>

      <section className="pb-20 lg:pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1.4fr_1fr_1fr] border-y border-(--color-border) dark:border-(--color-border-dark)">
          {plans.map((plan) => {
            const live = !!plan.cta
            return (
              <article key={plan.name}
                className={`flex flex-col py-10 lg:px-8 lg:first:pl-0 lg:last:pr-0 border-t first:border-t-0 lg:border-t-0 lg:border-l lg:first:border-l-0 border-(--color-border) dark:border-(--color-border-dark) ${live ? "" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-heading text-xl font-bold text-(--color-ink) dark:text-white">{plan.name}</h2>
                  <span className={`text-xs font-semibold ${live ? "text-emerald-700 dark:text-emerald-400" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}>
                    {live && <span aria-hidden="true" className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 align-middle" />}
                    {plan.status}
                  </span>
                </div>
                <p className="mt-5 flex items-baseline gap-1">
                  <span className={`font-heading text-5xl font-bold tracking-tight ${live ? "text-(--color-ink) dark:text-white" : ""}`}>{plan.price}</span>
                  {plan.period && <span className="text-sm font-semibold">{plan.period}</span>}
                </p>
                <p className="mt-3 text-base leading-relaxed">{plan.description}</p>

                {live ? (
                  <>
                    <ul className="mt-8 space-y-3 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-3 text-sm text-(--color-ink) dark:text-white">
                          <Check size={16} aria-hidden="true" className="shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />{f}
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.cta.to} className="group mt-10 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg bg-(--color-brand-600) text-white font-semibold hover:bg-(--color-brand-700) transition-colors">
                      {plan.cta.label} <ArrowRight size={18} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </>
                ) : (
                  <p className="mt-8 flex items-start gap-3 text-sm">
                    <Plus size={16} aria-hidden="true" className="shrink-0 mt-0.5" />
                    Everything in Beta. Plan details will be published before launch.
                  </p>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <section className="py-20 lg:py-24 bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) border-t border-(--color-border) dark:border-(--color-border-dark)">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHead label="Questions" title="Before you sign up" />
          <div className="max-w-3xl border-b border-(--color-border) dark:border-(--color-border-dark)">
            {faqs.map((f) => (
              <details key={f.q} className="group border-t border-(--color-border) dark:border-(--color-border-dark)">
                <summary className="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden text-lg font-semibold text-(--color-ink) dark:text-white">
                  {f.q}
                  <Plus size={18} aria-hidden="true" className="shrink-0 text-(--color-muted) dark:text-(--color-muted-dark) transition-transform group-open:rotate-45" />
                </summary>
                <p className="pb-6 -mt-1 text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-2xl">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
