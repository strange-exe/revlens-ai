import { Link } from "react-router-dom"
import Hero from "../components/Hero"
import Card from "../components/Card"
import { BarChart3, MessageSquareText, Sparkles } from "lucide-react"

const features = [
  {
    title: "Sentiment Analysis",
    description: "Automatically classify guest reviews as positive, neutral, or negative using AI-powered sentiment detection.",
    icon: <BarChart3 size={32} className="text-indigo-600 dark:text-indigo-400" />,
  },
  {
    title: "Theme Detection",
    description: "Identify recurring topics and trends across all your reviews to understand what guests love or complain about.",
    icon: <MessageSquareText size={32} className="text-indigo-600 dark:text-indigo-400" />,
  },
  {
    title: "AI Response Generator",
    description: "Generate professional, context-aware replies to guest reviews with the help of Google Gemini AI.",
    icon: <Sparkles size={32} className="text-indigo-600 dark:text-indigo-400" />,
  },
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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold">Why RevLens AI?</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Stop reading reviews one by one. Let AI do the heavy lifting.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.title}
              title={f.title}
              description={f.description}
              image={f.icon}
              action={{ label: "Learn More", onClick: () => {} }}
            />
          ))}
        </div>
      </section>

      <section className="bg-gray-50 dark:bg-gray-900/50 border-t border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl font-bold">Ready to get started?</h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Connect your properties and start analyzing reviews in minutes.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center mt-6 px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            Create Free Account
          </Link>
        </div>
      </section>
    </>
  )
}
