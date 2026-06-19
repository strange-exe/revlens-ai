const platforms = [
  { name: "Airbnb", color: "#FF5A5F" },
  { name: "Booking.com", color: "#003580" },
  { name: "Google Reviews", color: "#4285F4" },
  { name: "TripAdvisor", color: "#34E0A1" },
  { name: "MakeMyTrip", color: "#F44336" },
  { name: "Agoda", color: "#5A48E6" },
]

export default function Platforms({ nested = false }) {
  const content = (
    <>
      <div className="reveal text-center mb-6">
        <p className="text-xs font-semibold tracking-[0.15em] uppercase text-(--color-muted) dark:text-(--color-muted-dark)">
          Works with reviews from
        </p>
      </div>
      <div className="reveal flex flex-wrap items-center justify-center gap-8 sm:gap-12 lg:gap-16">
        {platforms.map((p) => (
          <div
            key={p.name}
            className="group flex items-center gap-2.5 opacity-40 hover:opacity-100 transition-all duration-500 cursor-default"
          >
            <div
              className="w-3 h-3 rounded-full transition-transform duration-300 group-hover:scale-125"
              style={{ backgroundColor: p.color }}
            />
            <span className="text-sm font-semibold text-(--color-muted) dark:text-(--color-muted-dark) group-hover:text-(--color-brand-600) dark:group-hover:text-white transition-colors">
              {p.name}
            </span>
          </div>
        ))}
      </div>
    </>
  )

  if (nested) {
    return (
      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-auto pt-8 pb-6 border-t border-(--color-border)/20 dark:border-(--color-border-dark)/20">
        {content}
      </div>
    )
  }

  return (
    <section className="relative py-16 overflow-hidden border-b border-(--color-border)/30 dark:border-(--color-border-dark)/30">
      <div className="absolute inset-0 noise-overlay" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {content}
      </div>
    </section>
  )
}
