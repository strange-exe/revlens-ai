import { Link } from "react-router-dom"
import Hero from "../components/Hero"
import Card from "../components/Card"
import { BarChart3, MessageSquareText, Sparkles, ArrowUpRight } from "lucide-react"

const features = [
  {
    title: "Sentiment Analysis",
    description: "Classify every review as positive, neutral, or negative using AI. Know at a glance how your property is performing.",
    icon: <BarChart3 size={28} className="text-[--color-brand-500]" />,
  },
  {
    title: "Theme Detection",
    description: "Surface recurring topics across all reviews. Spot what guests love and what needs fixing — instantly.",
    icon: <MessageSquareText size={28} className="text-[--color-brand-500]" />,
  },
  {
    title: "AI Response Generator",
    description: "Generate thoughtful, on-brand replies to reviews with one click. Save hours each week.",
    icon: <Sparkles size={28} className="text-[--color-brand-500]" />,
  },
]

const stats = [
  { value: "93%", label: "Accuracy rate" },
  { value: "3x", label: "Faster insights" },
  { value: "10+", label: "Source integrations" },
]

export default function Home() {
  return (
    <>
      <Hero
        title="Turn Reviews into Revenue"
        subtitle="AI-powered review intelligence for homestay owners. Analyze sentiment, detect themes, and generate smart responses — all in one dashboard."
        ctaText="Get Started"
        ctaLink="/dashboard"
      />

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="font-heading text-xs font-semibold tracking-[0.2em] uppercase text-[--color-brand-400] dark:text-[--color-brand-400]">Features</span>
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[--color-brand-600] dark:text-white mt-2">
            Intelligence, not just data
          </h2>
          <p className="mt-3 text-[--color-muted] dark:text-[--color-muted-dark] text-sm leading-relaxed">
            RevLens transforms unstructured guest feedback into actionable business insights.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {features.map((f) => (
            <Card
              key={f.title}
              title={f.title}
              description={f.description}
              image={f.icon}
              action={{ label: "Learn More", onClick: () => {} }}
              variant="feature"
            />
          ))}
        </div>
      </section>

      <section className="bg-[--color-brand-50] dark:bg-[--color-brand-900]/30 border-y border-[--color-border] dark:border-[--color-border-dark]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-heading text-4xl lg:text-5xl font-bold text-[--color-brand-500] dark:text-[--color-gold-400]">{s.value}</p>
                <p className="mt-1 text-sm text-[--color-muted] dark:text-[--color-muted-dark]">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl font-bold text-[--color-brand-600] dark:text-white">
            Ready to simplify your reviews?
          </h2>
          <p className="mt-3 text-sm text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed">
            Connect your properties and start understanding your guests better — in minutes, not hours.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[--color-brand-500] text-white text-sm font-semibold hover:bg-[--color-brand-600] transition-colors shadow-sm"
            >
              Create Free Account
              <ArrowUpRight size={15} />
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[--color-border] dark:border-[--color-border-dark] text-sm font-medium text-[--color-muted] dark:text-[--color-muted-dark] hover:bg-white dark:hover:bg-[--color-surface-elevated-dark] transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
