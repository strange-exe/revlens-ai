export default function About() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-20">
      <h1 className="text-3xl font-bold">About RevLens AI</h1>
      <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
        RevLens AI helps homestay owners analyze guest reviews, classify sentiment, identify recurring themes, and 
        generate actionable insights through AI-powered analytics and visual dashboards.
      </p>
      <p className="mt-4 text-gray-600 dark:text-gray-400 leading-relaxed">
        The platform centralizes feedback from multiple review sources and transforms unstructured reviews into 
        meaningful business intelligence. Using Google's Gemini API, RevLens AI can automatically classify sentiment, 
        detect key themes, suggest professional responses, and visualize trends through an interactive analytics dashboard.
      </p>
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="font-semibold">Tech Stack</h3>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>React + Vite + Tailwind CSS</li>
            <li>FastAPI (Python)</li>
            <li>PostgreSQL via Supabase</li>
            <li>Google Gemini API</li>
          </ul>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="font-semibold">Features</h3>
          <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <li>Review sentiment analysis</li>
            <li>Theme detection</li>
            <li>AI-generated responses</li>
            <li>Analytics dashboard</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
