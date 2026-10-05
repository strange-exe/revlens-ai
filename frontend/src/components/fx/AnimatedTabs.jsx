import { useLayoutEffect, useRef, useState } from "react"

// Port of Aceternity UI "Tabs": a pill that slides to the active tab (CSS transition, no animation runtime).
// Follows the WAI-ARIA tabs pattern: role=tablist/tab, aria-selected, roving tabindex, arrow/Home/End keys.
export default function AnimatedTabs({ tabs, value, onChange, label, idPrefix = "tab" }) {
  const listRef = useRef(null)
  const [pill, setPill] = useState(null)

  useLayoutEffect(() => {
    const measure = () => {
      const active = listRef.current?.querySelector('[aria-selected="true"]')
      if (active) setPill({ left: active.offsetLeft, width: active.offsetWidth })
    }
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [value, tabs])

  const onKeyDown = (e) => {
    const i = tabs.findIndex((t) => t.value === value)
    const next = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]
    if (next === undefined) return
    e.preventDefault()
    const target = tabs[(next + tabs.length) % tabs.length]
    onChange(target.value)
    listRef.current?.querySelector(`#${idPrefix}-${target.value}`)?.focus()
  }

  return (
    <div ref={listRef} role="tablist" aria-label={label} onKeyDown={onKeyDown}
      className="relative inline-flex items-center gap-1 p-1 rounded-xl bg-(--color-surface-muted) dark:bg-(--color-surface-muted-dark) border border-(--color-border) dark:border-(--color-border-dark)">
      {pill && (
        <span aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-lg bg-white dark:bg-(--color-surface-elevated-dark) shadow-sm ring-1 ring-(--color-border) dark:ring-white/10 transition-[transform,width] duration-300 ease-out"
          style={{ transform: `translateX(${pill.left - 4}px)`, width: pill.width, left: 4 }} />
      )}
      {tabs.map((t) => {
        const selected = t.value === value
        return (
          <button key={t.value} id={`${idPrefix}-${t.value}`} type="button" role="tab" aria-selected={selected}
            tabIndex={selected ? 0 : -1} onClick={() => onChange(t.value)}
            className={`relative z-10 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-(--color-brand-400) ${
              selected ? "text-(--color-ink) dark:text-white" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:text-(--color-brand-500)"}`}>
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
