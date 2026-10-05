import { useRef } from "react"

// Port of Aceternity UI "Card Spotlight": a glow that follows the pointer. The position is written to
// CSS variables on the element, so moving the mouse never re-renders React (index.css .fx-card-spotlight).
export default function CardSpotlight({ as: Tag = "div", className = "", children, ...props }) {
  const ref = useRef(null)
  const onPointerMove = (e) => {
    const el = ref.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty("--fx-x", `${e.clientX - rect.left}px`)
    el.style.setProperty("--fx-y", `${e.clientY - rect.top}px`)
  }
  return (
    <Tag ref={ref} onPointerMove={onPointerMove} className={`fx-card-spotlight ${className}`} {...props}>
      {children}
    </Tag>
  )
}
