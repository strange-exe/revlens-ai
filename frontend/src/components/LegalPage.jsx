// Shared layout for the Privacy Policy and Terms: title, last-updated date, an on-page contents list on wide
// screens, and sections kept to a readable line length.
export default function LegalPage({ label, title, updated, intro, sections }) {
  return (
    <section className="pt-32 pb-20 lg:pt-36 lg:pb-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-(--color-brand-600) dark:text-(--color-brand-300)">{label}</p>
        <h1 className="mt-3 font-heading text-[2.5rem] leading-[1.05] sm:text-5xl font-bold tracking-[-0.035em] text-(--color-ink) dark:text-white text-balance">
          {title}
        </h1>
        <p className="mt-4 text-sm text-(--color-muted) dark:text-(--color-muted-dark)">Last updated {updated}</p>
        <p className="mt-6 max-w-[65ch] text-lg leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark)">{intro}</p>

        <div className="mt-14 grid lg:grid-cols-[14rem_1fr] gap-10 lg:gap-16 border-t border-(--color-border) dark:border-(--color-border-dark) pt-10">
          <nav aria-label="On this page" className="hidden lg:block">
            <ol className="sticky top-24 space-y-2.5 text-sm">
              {sections.map((s) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-ink) dark:hover:text-white transition-colors">
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <div className="space-y-12">
            {sections.map((s) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="scroll-mt-24 max-w-[65ch]">
                <h2 id={`${s.id}-title`} className="font-heading text-xl font-bold text-(--color-ink) dark:text-white">{s.title}</h2>
                <div className="mt-4 space-y-4 text-base leading-relaxed text-(--color-ink)/85 dark:text-white/80 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_a]:underline [&_a]:underline-offset-4 [&_a]:text-(--color-brand-600) dark:[&_a]:text-(--color-brand-300) [&_strong]:font-semibold [&_strong]:text-(--color-ink) dark:[&_strong]:text-white">
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
