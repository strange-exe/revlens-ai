export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20 lg:py-28">
      <span className="font-heading text-xs font-semibold tracking-[0.2em] uppercase text-[--color-brand-400] dark:text-[--color-brand-400]">About</span>
      <h1 className="font-heading text-3xl sm:text-4xl font-bold text-[--color-brand-600] dark:text-white mt-2">
        RevLens AI
      </h1>
      <div className="mt-6 space-y-4 text-sm text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed">
        <p>
          RevLens AI helps homestay owners analyze guest reviews, classify sentiment, identify recurring themes, and
          generate actionable insights through AI-powered analytics and visual dashboards.
        </p>
        <p>
          The platform centralizes feedback from multiple review sources and transforms unstructured reviews into
          meaningful business intelligence. Using Google's Gemini API, RevLens AI can automatically classify sentiment,
          detect key themes, suggest professional responses, and visualize trends through an interactive analytics dashboard.
        </p>
      </div>
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-[--color-brand-200] dark:border-[--color-brand-800] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-5">
          <h3 className="font-heading text-sm font-semibold text-[--color-brand-600] dark:text-white">Tech Stack</h3>
          <ul className="mt-3 space-y-2 text-sm text-[--color-muted] dark:text-[--color-muted-dark]">
            {["React + Vite + Tailwind CSS", "FastAPI (Python)", "Supabase (PostgreSQL)", "Google Gemini API"].map(
              (item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1 h-1 rounded-full bg-[--color-brand-400]" />
                  {item}
                </li>
              ),
            )}
          </ul>
        </div>
        <div className="rounded-xl border border-[--color-brand-200] dark:border-[--color-brand-800] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] p-5">
          <h3 className="font-heading text-sm font-semibold text-[--color-brand-600] dark:text-white">Features</h3>
          <ul className="mt-3 space-y-2 text-sm text-[--color-muted] dark:text-[--color-muted-dark]">
            {["Sentiment analysis", "Theme detection", "AI-generated responses", "Analytics dashboard"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-[--color-gold-400]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
