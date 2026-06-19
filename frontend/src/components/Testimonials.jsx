import { Star, Quote } from "lucide-react"

const testimonials = [
  {
    name: "Priya Sharma",
    property: "Mountain View Homestay",
    location: "Manali, HP",
    text: "RevLens completely changed how I manage guest feedback. I used to spend hours reading through reviews — now the AI surfaces exactly what needs attention. My rating went from 4.2 to 4.7 in three months.",
    rating: 5,
    avatar: "PS",
  },
  {
    name: "Arjun Mehta",
    property: "Coastal Breeze Villa",
    location: "Goa",
    text: "The auto-generated responses are spot-on. Guests think I'm personally replying to each review, but it's RevLens doing the heavy lifting. It saves me at least 2 hours every day.",
    rating: 5,
    avatar: "AM",
  },
  {
    name: "Sarah Chen",
    property: "Lakeside Cottage",
    location: "Udaipur, RJ",
    text: "Theme detection is the killer feature. I discovered guests were consistently mentioning Wi-Fi issues I hadn't noticed. Fixed it, and my negative reviews dropped by 40%. Incredible tool.",
    rating: 4,
    avatar: "SC",
  },
]

export default function Testimonials() {
  return (
    <section className="relative py-28 lg:py-36 overflow-hidden bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark)">
      <div className="absolute inset-0 noise-overlay" />
      <div className="absolute inset-0 grid-pattern" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="reveal text-center mb-16">
          <span className="font-heading text-xs font-bold tracking-[0.2em] uppercase text-(--color-brand-400)">
            Testimonials
          </span>
          <h2 className="font-heading text-4xl sm:text-5xl font-bold text-(--color-brand-600) dark:text-white mt-3 leading-tight">
            Loved by homestay<br />owners everywhere
          </h2>
          <p className="mt-4 text-sm text-(--color-muted) dark:text-(--color-muted-dark) max-w-md mx-auto">
            Real results from real property managers using RevLens AI to transform their review management.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.name}
              className="reveal group relative rounded-2xl widget-card p-7 hover:-translate-y-1 flex flex-col h-full"
              style={{ transitionDelay: `${i * 0.1}s` }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-6 right-6 h-0.5 rounded-b-full bg-gradient-to-r from-transparent via-(--color-brand-400)/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <Quote size={20} className="text-(--color-brand-200) dark:text-(--color-brand-700) mb-4" />

              <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed flex-1">
                "{t.text}"
              </p>

              <div className="flex items-center gap-0.5 mt-4">
                {Array.from({ length: 5 }, (_, idx) => (
                  <Star
                    key={idx}
                    size={12}
                    className={`${idx < t.rating ? "fill-amber-400 text-amber-400" : "text-(--color-border) dark:text-(--color-border-dark)"}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-3 mt-5 pt-5 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-(--color-brand-300) to-(--color-brand-500) flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-bold text-(--color-brand-600) dark:text-white">{t.name}</p>
                  <p className="text-[11px] text-(--color-muted) dark:text-(--color-muted-dark)">
                    {t.property} · {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
