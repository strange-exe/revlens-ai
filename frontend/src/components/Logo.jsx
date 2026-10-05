import { Link } from "react-router-dom"

// One flat mark + wordmark used by the navbar and footer (no gradients: violet is the action colour).
export default function Logo({ size = 32 }) {
  return (
    <Link to="/" className="inline-flex items-center gap-2.5 whitespace-nowrap" aria-label="RevLens AI home">
      <svg width={size} height={size} viewBox="0 0 36 36" fill="none" aria-hidden="true">
        <rect width="36" height="36" rx="8" className="fill-(--color-ink) dark:fill-white" />
        <path d="M10 9h9.5a5 5 0 0 1 0 10H14.5l5.5 8H16l-5.5-8.2V9Z" className="fill-white dark:fill-(--color-ink)" />
        <circle cx="26.5" cy="25.5" r="3.5" className="fill-(--color-brand-500) dark:fill-(--color-brand-400)" />
      </svg>
      <span className="font-heading text-lg font-bold tracking-tight leading-none text-(--color-ink) dark:text-white">
        RevLens
      </span>
    </Link>
  )
}
