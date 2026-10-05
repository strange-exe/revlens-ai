// Page-shaped placeholder while data or a route's code loads: the layout appears instantly instead of a spinner.
const block = "skeleton rounded-xl"

export default function PageSkeleton({ label = "Loading", variant = "dashboard" }) {
  return (
    <div role="status" aria-busy="true" className="space-y-6">
      <span className="sr-only">{label}…</span>
      <div className="space-y-2" aria-hidden="true">
        <div className={`${block} h-7 w-48`} />
        <div className={`${block} h-4 w-72 max-w-full`} />
      </div>
      {variant === "dashboard" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => <div key={i} className={`${block} h-32`} />)}
        </div>
      )}
      <div className={`grid gap-4 ${variant === "chat" ? "" : "md:grid-cols-2"}`} aria-hidden="true">
        {(variant === "chat" ? [0, 1, 2] : [0, 1, 2, 3]).map((i) => (
          <div key={i} className={`${block} ${variant === "chat" ? "h-16" : "h-44"}`} />
        ))}
      </div>
    </div>
  )
}
