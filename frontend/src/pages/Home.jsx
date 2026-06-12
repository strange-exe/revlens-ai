import { Link } from "react-router-dom"
import Hero from "../components/Hero"
import Platforms from "../components/Platforms"
import StatCounter from "../components/StatCounter"
import Testimonials from "../components/Testimonials"
import useScrollReveal from "../hooks/useScrollReveal"
import { BarChart3, MessageSquareText, Sparkles, ArrowUpRight, Quote, Shield, Clock, Globe, ChevronRight } from "lucide-react"

const features = [
  {
    title: "Sentiment Analysis",
    description: "Classify every review as positive, neutral, or negative using AI. Know at a glance how your property is performing.",
    icon: <BarChart3 size={24} />,
    gradient: "from-emerald-400 to-teal-600",
    lightBg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  {
    title: "Theme Detection",
    description: "Surface recurring topics across all reviews. Spot what guests love and what needs fixing — instantly.",
    icon: <MessageSquareText size={24} />,
    gradient: "from-violet-400 to-purple-600",
    lightBg: "bg-violet-50 dark:bg-violet-900/20",
  },
  {
    title: "AI Responses",
    description: "Generate thoughtful, on-brand replies to reviews with one click. Save hours while staying personal.",
    icon: <Sparkles size={24} />,
    gradient: "from-amber-400 to-orange-600",
    lightBg: "bg-amber-50 dark:bg-amber-900/20",
  },
]

const stats = [
  { value: "93%", label: "Accuracy rate" },
  { value: "3x", label: "Faster insights" },
  { value: "10+", label: "Platform integrations" },
]

const process = [
  {
    step: "01",
    title: "Connect",
    desc: "Link your properties from Airbnb, Booking.com, Google, and more.",
    color: "bg-(--color-brand-400)",
  },
  {
    step: "02",
    title: "Analyze",
    desc: "AI classifies sentiment, detects themes, and scores each review.",
    color: "bg-(--color-gold-400)",
  },
  {
    step: "03",
    title: "Act",
    desc: "Get recommended responses, track trends, and improve your ratings.",
    color: "bg-violet-400",
  },
]

const benefits = [
  {
    icon: <Clock size={22} />,
    title: "Save 10+ Hours Weekly",
    description: "Automate review reading, classification, and response generation. Focus on what matters — your guests.",
    gradient: "from-(--color-brand-400)/10 to-transparent",
  },
  {
    icon: <Shield size={22} />,
    title: "Data Privacy First",
    description: "Your review data is encrypted end-to-end. We never share or sell your data. GDPR & CCPA compliant.",
    gradient: "from-violet-400/10 to-transparent",
  },
  {
    icon: <Globe size={22} />,
    title: "Multi-Platform Support",
    description: "One dashboard for all your review sources. No more juggling between Airbnb, Booking.com, and Google.",
    gradient: "from-(--color-gold-400)/10 to-transparent",
  },
]

export default function Home() {
  const containerRef = useScrollReveal()

  return (
    <div ref={containerRef}>
      <Hero
        title="Turn Reviews<br/>into Revenue"
        subtitle="AI-powered review intelligence for homestay owners. Analyze sentiment, detect themes, and generate smart responses — all in one dashboard."
        ctaText="Get Started"
        ctaLink="/dashboard"
      />

      {/* Platforms Bar */}
      <Platforms />

      {/* Features Section */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-(--color-brand-200)/15 dark:bg-(--color-brand-800)/15 blur-[120px]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">Features</span>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
                Intelligence,<br />not just data
              </h2>
            </div>
            <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed max-w-sm">
              RevLens transforms unstructured guest feedback into actionable business insights using AI.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="reveal group relative rounded-2xl widget-card overflow-hidden hover:-translate-y-1"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                {/* Top gradient accent */}
                <div className={`h-1 bg-gradient-to-r ${f.gradient} opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Hover glow */}
                <div className={`absolute inset-0 bg-gradient-to-b ${f.gradient} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />

                <div className="relative p-7">
                  <div className={`w-12 h-12 rounded-xl ${f.lightBg} flex items-center justify-center mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                    <span className="text-(--color-brand-600) dark:text-white">{f.icon}</span>
                  </div>
                  <h3 className="font-heading text-lg font-bold text-(--color-brand-600) dark:text-white">{f.title}</h3>
                  <p className="mt-2.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">{f.description}</p>
                  <div className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-(--color-brand-500) dark:text-(--color-gold-400) group-hover:gap-2.5 transition-all cursor-pointer">
                    Learn More
                    <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-(--color-brand-600) to-(--color-brand-800) dark:from-(--color-brand-900) dark:to-black" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-(--color-gold-400)/5 blur-[120px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
            {stats.map((s) => (
              <StatCounter key={s.label} value={s.value} label={s.label} />
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative py-28 lg:py-36 overflow-hidden">
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-(--color-brand-100)/30 dark:bg-(--color-brand-800)/30 blur-[100px]" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
            <div className="max-w-xl">
              <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">How It Works</span>
              <h2 className="font-heading text-4xl sm:text-5xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
                Three steps to<br />smarter reviews
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {process.map((p, i) => (
              <div key={p.step} className="reveal relative" style={{ transitionDelay: `${i * 0.1}s` }}>
                {i < process.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-full h-px bg-gradient-to-r from-(--color-brand-200) to-transparent dark:from-(--color-brand-700)" />
                )}
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-2xl ${p.color}/10 flex items-center justify-center`}>
                    <span className={`font-heading text-2xl font-bold bg-gradient-to-br ${p.color === "bg-(--color-brand-400)" ? "from-(--color-brand-400) to-(--color-brand-600)" : p.color === "bg-(--color-gold-400)" ? "from-(--color-gold-400) to-(--color-gold-600)" : "from-violet-400 to-violet-600"} bg-clip-text text-transparent`}>
                      {p.step}
                    </span>
                  </div>
                </div>
                <h3 className="font-heading text-xl font-bold text-(--color-brand-600) dark:text-white">{p.title}</h3>
                <p className="mt-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark)">
        <div className="absolute inset-0 noise-overlay" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="reveal text-center mb-14">
            <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
              Why RevLens
            </span>
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
              Built for hospitality
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {benefits.map((b, i) => (
              <div
                key={b.title}
                className="reveal group relative rounded-2xl widget-card p-7 overflow-hidden hover:-translate-y-0.5"
                style={{ transitionDelay: `${i * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${b.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                <div className="relative">
                  <div className="p-3 rounded-xl w-fit bg-(--color-brand-50) dark:bg-(--color-brand-800) text-(--color-brand-500) dark:text-(--color-brand-300) mb-4 transition-transform duration-300 group-hover:scale-105">
                    {b.icon}
                  </div>
                  <h3 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white">{b.title}</h3>
                  <p className="mt-2 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* CTA Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-(--color-brand-600) to-(--color-brand-900) dark:from-black dark:to-(--color-brand-900)" />
        <div className="absolute inset-0 noise-overlay" />
        <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] rounded-full bg-(--color-gold-400)/5 blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-28 lg:py-32">
          <div className="reveal max-w-2xl mx-auto text-center">
            <Quote size={32} className="text-(--color-gold-400)/40 mx-auto mb-6" />
            <h2 className="font-heading text-4xl sm:text-5xl font-bold text-white leading-tight">
              Ready to simplify<br />your reviews?
            </h2>
            <p className="mt-4 text-base text-white/60 leading-relaxed max-w-md mx-auto">
              Connect your properties and start understanding your guests better — in minutes, not hours.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                to="/login"
                className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-white text-(--color-brand-600) text-sm font-bold hover:bg-(--color-gold-50) transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5"
              >
                Create Free Account
                <ArrowUpRight size={16} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
