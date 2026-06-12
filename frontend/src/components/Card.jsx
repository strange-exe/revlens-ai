export default function Card({ title, description, image, action, variant = "default" }) {
  const isFeature = variant === "feature"

  return (
    <div className={`group relative rounded-xl border bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] overflow-hidden transition-all duration-300 ${isFeature ? "border-[--color-brand-200] dark:border-[--color-brand-800] hover:border-[--color-brand-300] dark:hover:border-[--color-brand-700] hover:shadow-md" : "border-[--color-border] dark:border-[--color-border-dark] hover:border-[--color-border] dark:hover:border-[--color-border-dark]"}`}>
      {isFeature && (
        <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-[--color-brand-400] to-[--color-gold-400] dark:from-[--color-brand-500] dark:to-[--color-gold-600] opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
      {image && (
        <div className="aspect-video bg-[--color-brand-50] dark:bg-[--color-brand-900]/40 flex items-center justify-center overflow-hidden">
          {typeof image === "string" ? (
            <img src={image} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="p-4 transition-transform duration-300 group-hover:scale-105">{image}</div>
          )}
        </div>
      )}
      <div className="p-6">
        <h3 className="font-heading text-lg font-semibold text-[--color-brand-600] dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-2 text-sm text-[--color-muted] dark:text-[--color-muted-dark] leading-relaxed">
            {description}
          </p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-4 text-xs font-semibold tracking-widest uppercase text-[--color-brand-500] dark:text-[--color-gold-400] hover:text-[--color-brand-600] dark:hover:text-[--color-gold-300] transition-colors cursor-pointer"
          >
            {action.label}
            <span className="inline-block ml-1 transition-transform group-hover:translate-x-0.5">&rarr;</span>
          </button>
        )}
      </div>
    </div>
  )
}
