import { useNavigate } from "react-router-dom"
import Button from "../components/ui/Button"
import { Check, Sparkles, Building2, Zap, ArrowRight, ChevronDown, ChevronUp } from "lucide-react"
import useScrollReveal from "../hooks/useScrollReveal"
import { useState, useRef } from "react"

// Advanced 3D Parallax Card component with spotlight reflection, dynamic casting shadow, and multi-layered depth
function ParallaxCard({ children, className, highlighted, style }) {
  const cardRef = useRef(null)
  const [parallaxState, setParallaxState] = useState({
    rotateX: 0,
    rotateY: 0,
    shineX: 50,
    shineY: 50,
    isHovered: false
  })
  const { rotateX, rotateY, shineX, shineY, isHovered } = parallaxState

  const handleMouseMove = (e) => {
    if (!cardRef.current) return
    const card = cardRef.current
    const rect = card.getBoundingClientRect()
    
    // Calculate mouse position relative to card boundaries
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    // Convert to percentage (0 to 100) for radial gradient spotlight placement
    const px = (x / rect.width) * 100
    const py = (y / rect.height) * 100
    
    // Calculate 3D rotation angles (-10 to 10 degrees for high-fidelity interactive feel)
    const maxRotation = 9
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -maxRotation
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * maxRotation
    
    setParallaxState({
      rotateX: rx,
      rotateY: ry,
      shineX: px,
      shineY: py,
      isHovered: true
    })
  }

  const handleMouseEnter = () => {
    setParallaxState(prev => ({ ...prev, isHovered: true }))
  }

  const handleMouseLeave = () => {
    setParallaxState({
      rotateX: 0,
      rotateY: 0,
      shineX: 50,
      shineY: 50,
      isHovered: false
    })
  }

  // Cast shadow in opposite direction of tilt for premium 3D depth perception
  const shadowStyle = isHovered
    ? highlighted
      ? `${-rotateY * 3.5}px ${rotateX * 3.5}px 55px rgba(0, 71, 171, 0.35), 0 10px 30px rgba(0, 0, 0, 0.15)`
      : `${-rotateY * 2.5}px ${rotateX * 2.5}px 45px rgba(0, 0, 0, 0.16), 0 5px 15px rgba(0, 0, 0, 0.08)`
    : highlighted
      ? "0 20px 40px -15px rgba(0, 71, 171, 0.4), 0 5px 15px rgba(0, 0, 0, 0.1)"
      : "0 10px 30px -10px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.02)"

  const cardStyle = {
    transform: isHovered 
      ? `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.03, 1.03, 1.03)` 
      : 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.6s ease',
    transformStyle: 'preserve-3d',
    boxShadow: shadowStyle,
    ...style
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={cardStyle}
      className={`relative select-none ${className}`}
    >
      {/* Shifting background neon backglow for highlighted card */}
      {highlighted && (
        <div 
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-(--color-accent-400) to-(--color-brand-500) opacity-25 blur-3xl -z-10 transition-transform duration-500 scale-[0.9] group-hover:scale-[1.05]"
          style={{
            transform: isHovered 
              ? `translate3d(${-rotateY * 0.6}px, ${-rotateX * 0.6}px, -30px)` 
              : 'translate3d(0,0,0)',
            transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />
      )}

      {/* Dynamic light reflection layer */}
      <div
        className="absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 rounded-2xl overflow-hidden"
        style={{
          opacity: isHovered ? (highlighted ? 0.35 : 0.15) : 0,
          background: `radial-gradient(circle 250px at ${shineX}% ${shineY}%, rgba(255,255,255,0.85), transparent 85%)`,
          mixBlendMode: 'overlay',
        }}
      />

      {/* 3D Depth Content Layer */}
      <div 
        style={{ 
          transform: isHovered ? 'translateZ(35px)' : 'translateZ(0px)', 
          transition: isHovered ? 'none' : 'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          transformStyle: 'preserve-3d' 
        }}
        className="h-full w-full relative z-10"
      >
        {children}
      </div>
    </div>
  )
}

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
        type="button"
        aria-expanded={open}
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
      <section className="relative min-h-[80dvh] flex items-center overflow-hidden bg-gradient-to-b from-(--color-brand-50) to-(--color-surface) dark:from-(--color-brand-900)/20 dark:to-(--color-surface-dark) pt-32 pb-20">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-(--color-brand-200)/20 dark:bg-(--color-brand-800)/30 blur-[120px]" />

        <div className="relative w-full max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <span className="reveal font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
            Pricing Options
          </span>
          <h1 className="reveal font-heading text-4xl sm:text-5xl lg:text-6xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight font-serif">
            Simple, transparent pricing
          </h1>
          <p className="reveal mt-4 text-base text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-lg mx-auto font-sans">
            Start free, upgrade when you're ready. No hidden fees, no lock-in contracts. Cancel anytime.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative min-h-[100dvh] flex items-center py-20 lg:py-28 overflow-hidden bg-white/30 dark:bg-black/30 backdrop-blur-3xl">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 items-stretch max-w-lg lg:max-w-none mx-auto">
            {plans.map((plan, i) => (
              <ParallaxCard
                key={plan.name}
                highlighted={plan.highlighted}
                className={`reveal relative rounded-2xl overflow-hidden flex flex-col justify-between h-full group ${
                  plan.highlighted
                    ? "bg-gradient-to-b from-(--color-brand-600) via-(--color-brand-700) to-(--color-brand-900) dark:from-(--color-brand-700) dark:via-(--color-brand-800) dark:to-black text-white ring-1 ring-(--color-brand-400)/30 md:scale-[1.04]"
                    : "widget-card"
                }`}
                style={{ transitionDelay: `${i * 0.1}s`, transformStyle: 'preserve-3d' }}
              >
                {/* Top gradient bar */}
                {!plan.highlighted && (
                  <div className={`h-1 bg-gradient-to-r ${plan.gradient} opacity-50`} />
                )}

                {plan.highlighted && (
                  <div className="absolute -top-px left-0 right-0 h-1 bg-gradient-to-r from-(--color-accent-400) via-(--color-brand-400) to-(--color-accent-400)" />
                )}

                {plan.highlighted && (
                  <div className="flex justify-center pt-4" style={{ transform: 'translateZ(25px)' }}>
                    <span className="px-4 py-1 rounded-full bg-(--color-accent-500) text-black text-[10px] font-bold uppercase tracking-wider shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col justify-between h-full flex-grow" style={{ transformStyle: 'preserve-3d' }}>
                  {/* Upper Section */}
                  <div className="space-y-6" style={{ transformStyle: 'preserve-3d' }}>
                    <div 
                      className={`p-3.5 rounded-2xl w-fit ${plan.highlighted ? "bg-white/10" : "bg-(--color-brand-50) dark:bg-(--color-brand-800)"}`}
                      style={{ transform: 'translateZ(45px)' }}
                    >
                      <span className={plan.highlighted ? "text-(--color-accent-400)" : "text-(--color-brand-500) dark:text-(--color-brand-300)"}>
                        {plan.icon}
                      </span>
                    </div>

                    <h3 
                      className={`font-heading text-xl font-bold ${plan.highlighted ? "text-white" : "text-(--color-brand-600) dark:text-white"}`}
                      style={{ transform: 'translateZ(30px)' }}
                    >
                      {plan.name}
                    </h3>

                    <div className="mt-3 flex items-baseline gap-1" style={{ transform: 'translateZ(40px)' }}>
                      <span className={`font-heading text-4xl sm:text-5xl font-bold tracking-tight ${plan.highlighted ? "text-white" : "text-(--color-brand-600) dark:text-white"} font-serif`}>
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span className={`text-sm font-semibold ${plan.highlighted ? "text-white/60" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}>
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <p 
                      className={`text-xs leading-relaxed font-medium ${plan.highlighted ? "text-white/70" : "text-(--color-muted) dark:text-(--color-muted-dark)"}`}
                      style={{ transform: 'translateZ(25px)' }}
                    >
                      {plan.description}
                    </p>

                    <div className={`h-px ${plan.highlighted ? "bg-white/10" : "bg-(--color-border) dark:bg-(--color-border-dark)"}`} style={{ transform: 'translateZ(20px)' }} />

                    <ul className="space-y-4" style={{ transform: 'translateZ(28px)', transformStyle: 'preserve-3d' }}>
                      {plan.features.map((f, idx) => (
                        <li key={f} className="flex items-center gap-3 text-xs font-semibold" style={{ transform: `translateZ(${10 + idx * 2}px)` }}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlighted ? "bg-(--color-accent-500)/20" : "bg-(--color-brand-50) dark:bg-(--color-brand-800)"}`}>
                            <Check size={10} className={`shrink-0 ${plan.highlighted ? "text-(--color-accent-400)" : "text-(--color-brand-400)"}`} strokeWidth={3} />
                          </div>
                          <span className={plan.highlighted ? "text-white/80" : "text-(--color-muted) dark:text-(--color-muted-dark)"}>
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Lower Button Section */}
                  <div className="pt-8" style={{ transform: 'translateZ(50px)' }}>
                    <Button
                      variant={plan.highlighted ? "custom" : "primary"}
                      onClick={() => navigate(plan.ctaLink)}
                      icon={<ArrowRight size={14} className="transition-transform group-hover:translate-x-1.5" />}
                      iconPosition="right"
                      className={`group w-full py-4 text-xs font-bold ${
                        plan.highlighted
                          ? "bg-white/15 border border-white/20 text-white hover:bg-white hover:border-transparent hover:text-(--color-brand-600) shadow-lg hover:shadow-xl transition-all"
                          : "shadow-md hover:shadow-lg"
                      }`}
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </div>
              </ParallaxCard>
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
            <h2 className="font-heading text-3xl sm:text-4xl font-bold text-(--color-brand-600) dark:text-white mt-3 font-serif">
              Common Questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} faq={faq} />
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
