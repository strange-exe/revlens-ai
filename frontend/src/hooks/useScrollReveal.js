import { useEffect, useRef } from "react"

/**
 * Adds the "visible" class to .reveal elements when they scroll into view.
 * Attach the returned ref to a parent container.
 */
export default function useScrollReveal(threshold = 0.15) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    )

    const elements = container.querySelectorAll(".reveal")
    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [threshold])

  return containerRef
}
