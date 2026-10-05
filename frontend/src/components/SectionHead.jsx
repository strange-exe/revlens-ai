// Section heading: a small label + a left-aligned headline (no eyebrow pills, no centred template).
export default function SectionHead({ label, title, children }) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.2fr] gap-4 lg:gap-16 items-end mb-12">
      <div>
        <p className="text-sm font-semibold text-(--color-muted) dark:text-(--color-muted-dark)">{label}</p>
        <h2 className="mt-2 font-heading text-3xl sm:text-4xl font-bold tracking-[-0.03em] leading-tight text-(--color-ink) dark:text-white text-balance">{title}</h2>
      </div>
      {children && <p className="text-base leading-relaxed text-(--color-muted) dark:text-(--color-muted-dark) max-w-lg">{children}</p>}
    </div>
  )
}
