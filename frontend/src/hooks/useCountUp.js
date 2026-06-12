import { useState, useEffect, useRef, useCallback } from "react"

/**
 * Animate a number counting up from 0 to `end` when the element
 * scrolls into view. Returns [displayValue, ref].
 */
export default function useCountUp(end, duration = 1800) {
  const [value, setValue] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  const animate = useCallback(() => {
    if (hasAnimated.current) return
    hasAnimated.current = true

    const numericEnd = typeof end === "string" ? parseFloat(end) : end
    if (isNaN(numericEnd)) {
      setValue(end)
      return
    }

    const startTime = performance.now()
    const step = (now) => {
      const progress = Math.min((now - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // ease-out cubic
      setValue(Math.round(eased * numericEnd))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [end, duration])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) animate()
      },
      { threshold: 0.3 },
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [animate])

  return [value, ref]
}
