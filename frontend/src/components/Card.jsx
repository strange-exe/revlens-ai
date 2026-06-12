export default function Card({ title, description, image, action, variant = "default" }) {
  const isFeature = variant === "feature"
  const isStat = variant === "stat"

  if (isStat) {
    return (
      <div className="group relative rounded-2xl widget-card p-6 hover:-translate-y-0.5">
        <div className="flex items-center gap-4">
          {image && (
            <div className="p-3 rounded-xl bg-(--color-brand-100) dark:bg-(--color-brand-800) text-(--color-brand-600) dark:text-(--color-brand-300) transition-transform duration-300 group-hover:scale-105 shadow-sm">
              {image}
            </div>
          )}
          <div>
            <p className="font-heading text-3xl font-bold text-(--color-brand-600) dark:text-white">{title}</p>
            <p className="text-sm text-(--color-muted) dark:text-(--color-muted-dark)">{description}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`group relative rounded-2xl overflow-hidden transition-all duration-500 ${isFeature ? "widget-card hover:shadow-xl hover:-translate-y-1" : "glass-card"}`}>
      {isFeature && (
        <>
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-b from-(--color-brand-400)/5 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-(--color-brand-400) to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </>
      )}
      {image && (
        <div className="relative aspect-[16/9] bg-gradient-to-br from-(--color-brand-50) to-(--color-brand-100) dark:from-(--color-brand-900)/40 dark:to-(--color-brand-800)/40 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 noise-overlay" />
          {typeof image === "string" ? (
            <img src={image} alt={title} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-105" />
          ) : (
            <div className="p-6 transition-all duration-500 group-hover:scale-110 group-hover:-rotate-2">{image}</div>
          )}
        </div>
      )}
      <div className="relative p-7">
        <h3 className="font-heading text-lg font-bold text-(--color-brand-600) dark:text-white transition-colors">
          {title}
        </h3>
        {description && (
          <p className="mt-2.5 text-sm text-(--color-muted) dark:text-(--color-muted-dark) leading-relaxed">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="group/btn mt-5 inline-flex items-center gap-2 text-xs font-bold tracking-[0.12em] uppercase text-(--color-brand-500) dark:text-(--color-gold-400) hover:text-(--color-brand-600) dark:hover:text-(--color-gold-300) transition-colors cursor-pointer"
          >
            <span>{action.label}</span>
            <span className="inline-block transition-all duration-300 group-hover/btn:translate-x-1.5 group-hover/btn:-translate-y-0.5">&rarr;</span>
          </button>
        )}
      </div>
    </div>
  )
}
