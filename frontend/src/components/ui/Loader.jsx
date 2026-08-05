import React from "react"

const sizeMap = {
  sm: { circle: "h-5 w-5", text: "text-xs" },
  md: { circle: "h-9 w-9", text: "text-sm" },
  lg: { circle: "h-14 w-14", text: "text-base" },
}

/**
 * @typedef {Object} LoaderProps
 * @property {('sm'|'md'|'lg')} [size='md'] - Visual size of the loader
 * @property {('spinner'|'pulse'|'dots')} [variant='spinner'] - Animation variant type
 * @property {string} [text] - Optional text to show alongside/below the loader
 * @property {boolean} [fullPage=false] - If true, overlays the entire viewport with a blurred backdrop
 */

/**
 * A beautiful loading component supporting multiple size, animation variants, and modal overlay mode.
 * @param {LoaderProps} props
 */
export default function Loader({
  size = "md",
  variant = "spinner",
  text,
  fullPage = false,
}) {
  const loaderElement = (
    <div className="flex flex-col items-center justify-center gap-3">
      {variant === "spinner" && (
        <svg
          className={`animate-spin text-(--color-brand-500) dark:text-(--color-brand-400) ${sizeMap[size].circle}`}
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3.5"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {variant === "pulse" && (
        <div
          className={`rounded-full bg-(--color-brand-400) animate-pulse ${sizeMap[size].circle}`}
        />
      )}

      {variant === "dots" && (
        <div className="flex gap-1.5 items-center">
          <div className="w-2.5 h-2.5 rounded-full bg-(--color-brand-400) animate-smooth-bob [animation-delay:-0.3s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-(--color-brand-400) animate-smooth-bob [animation-delay:-0.15s]" />
          <div className="w-2.5 h-2.5 rounded-full bg-(--color-brand-400) animate-smooth-bob" />
        </div>
      )}

      {text && (
        <span
          className={`font-semibold text-(--color-muted) dark:text-(--color-muted-dark) ${sizeMap[size].text}`}
        >
          {text}
        </span>
      )}
    </div>
  )

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300">
        <div className="p-8 rounded-2xl bg-white dark:bg-(--color-surface-elevated-dark) shadow-2xl border border-(--color-border)/20 dark:border-(--color-border-dark)/20">
          {loaderElement}
        </div>
      </div>
    )
  }

  return loaderElement
}
