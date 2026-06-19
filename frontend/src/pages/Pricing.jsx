import { useNavigate } from "react-router-dom"
import { Button } from "../components/ui"
import { Check, Sparkles, Building2, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import useScrollReveal from "../hooks/useScrollReveal"
import { useState } from "react"

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    description: "Perfect for trying out RevLens with a single property.",
    icon: <Zap size={20} />,
    features: [
      "1 property",
      "50 reviews / month",
      "Sentiment analysis",
      "Basic dashboard",
      "Email support",
    ],
    cta: "Get Started Free",
    ctaLink: "/login",
    highlighted: false,
    gradient: "from-emerald-400 to-teal-500",
  },
  {
    name: "Professional",
    price: "₹1,499",
    period: "/month",
    description: "For growing homestay businesses managing multiple properties.",
    icon: <Sparkles size={20} />,
    features: [
      "Up to 10 properties",
      "Unlimited reviews",
      "AI-generated responses",
      "Theme detection",
      "Advanced analytics",
      "Priority support",
      "Export reports (PDF/CSV)",
    ],
    cta: "Start 14-Day Trial",
    ctaLink: "/login",
    highlighted: true,
    gradient: "from-(--color-brand-400) to-(--color-brand-600)",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "For chains and agencies with large portfolios.",
    icon: <Building2 size={20} />,
    features: [
      "Unlimited properties",
      "Unlimited reviews",
      "Everything in Professional",
      "Custom AI training",
      "API access",
      "Dedicated account manager",
      "SSO & team management",
    ],
    cta: "Contact Sales",
    ctaLink: "/about",
    highlighted: false,
    gradient: "from-violet-400 to-purple-500",
  },
]

const faqs = [
  {
    q: "Can I try RevLens for free?",
    a: "Yes! The Starter plan is completely free and lets you analyze up to 50 reviews per month for one property. No credit card required.",
  },
  {
    q: "Which review platforms are supported?",
    a: "RevLens integrates with Airbnb, Booking.com, Google Reviews, TripAdvisor, MakeMyTrip, Agoda, and more. We're constantly adding new sources.",
  },
  {
    q: "How accurate is the AI sentiment analysis?",
    a: "Our Gemini-powered model achieves 93%+ accuracy across English reviews. We continuously fine-tune the model with domain-specific hospitality data.",
  },
  {
    q: "Can I cancel my subscription anytime?",
    a: "Absolutely. There are no lock-in contracts. You can downgrade or cancel your plan at any time from your dashboard settings.",
  },
]

function FaqItem({ faq }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="reveal rounded-2xl widget-card overflow-hidden transition-all duration-300 hover:shadow-md">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-6 text-left cursor-pointer"
      >
        <h3 className="font-heading text-sm font-bold text-(--color-brand-600) dark:text-white pr-4">
          {faq.q}
        </h3>
        <span className="shrink-0 p-1 rounded-lg bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) text-(--color-muted) dark:text-(--color-muted-dark)">
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      <div
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-6 pb-6 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Pricing() {
  const containerRef = useScrollReveal()
  const navigate = useNavigate()

  return (
    <div ref={containerRef}>
      {/* Hero Banner */}
      <section className="relative min-h-[100dvh] flex items-center overflow-hidden bg-gradient-to-b from-(--color-brand-50) to-(--color-surface) dark:from-(--color-brand-900)/20 dark:to-(--color-surface-dark) pt-32 pb-20">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-(--color-brand-200)/20 dark:bg-(--color-brand-800)/30 blur-[120px]" />

        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="reveal font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
            Pricing
          </span>
          <h1 className="reveal font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
            Simple, transparent pricing
          </h1>
          <p className="reveal mt-4 text-base text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-lg mx-auto">
            Start free, upgrade when you're ready. No hidden fees, no lock-in contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start max-w-lg lg:max-w-none mx-auto">
            {plans.map((plan, i) => (
              <div
                key={plan.name}
                className={`reveal relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-(--color-brand-600) to-(--color-brand-800) dark:from-(--color-brand-700) dark:to-black text-white shadow-2xl ring-1 ring-(--color-brand-400)/30 md:scale-[1.04]"
                    : "widget-card hover:shadow-xl"
                }`}
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Top gradient bar */}
                {!plan.highlighted && (
                  <div className={`h-1 bg-gradient-to-r ${plan.gradient} opacity-50`} />
                )}

                {plan.highlighted && (
                  <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-(--color-accent-400) via-(--color-brand-400) to-(--color-accent-400)" />
                )}

                {plan.highlighted && (
                  <div className="flex justify-center pt-4">
                    <span className="px-4 py-1 rounded-full bg-(--color-accent-500) text-black text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-7">
                  <div className={`p-3 rounded-xl w-fit mb-4 ${plan.highlighted ? "bg-white/10" : "bg-(--color-brand-50) dark:bg-(--color-brand-800)"}`}>
                    <span className={plan.highlighted ? "text-(--color-accent-400)" : "text-(--color-brand-500) dark:text-(--color-brand-300)"}>
                      {plan.icon}
                    </span>
                  </div>

                  <h3 className={`font-heading text-lg font-bold ${plan.highlighted ? "text-white" : "text-(--color-brand-600) dark:text-white"}`}>
                    {plan.name}
                  </h3>

                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={`font-heading text-4xl font-bold ${plan.highlighted ? "text-white" : "text-(--color-brand-600) dark:text-white"}`}>
                      {plan.price}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ${plan.highlighted ? "text-white/60" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}>
                        {plan.period}
                      </span>
                    )}
                  </div>

                  <p className={`mt-3 text-sm leading-relaxed ${plan.highlighted ? "text-white/70" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}>
                    {plan.description}
                  </p>

                  <div className={`h-px my-6 ${plan.highlighted ? "bg-white/10" : "bg-(--color-border) dark:bg-(--color-border-dark)"}`} />

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlighted ? "bg-(--color-accent-500)/20" : "bg-(--color-brand-50) dark:bg-(--color-brand-800)"}`}>
                          <Check size={10} className={`shrink-0 ${plan.highlighted ? "text-(--color-accent-400)" : "text-(--color-brand-400)"}`} strokeWidth={3} />
                        </div>
                        <span className={plan.highlighted ? "text-white/80" : "text-(--color-muted) dark:text-(--color-muted-dark)"}>
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    variant={plan.highlighted ? "secondary" : "primary"}
                    onClick={() => navigate(plan.ctaLink)}
                    icon={<ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />}
                    iconPosition="right"
                    className={`group w-full ${
                      plan.highlighted
                        ? "bg-white border-none text-(--color-brand-600) hover:bg-(--color-brand-50) shadow-lg hover:shadow-xl dark:bg-white dark:text-(--color-brand-600) dark:hover:bg-(--color-brand-50)"
                        : "shadow-md hover:shadow-lg"
                    }`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark)">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">FAQ</span>
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-(--color-brand-600) dark:text-white mt-3">
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <FaqItem key={i} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
