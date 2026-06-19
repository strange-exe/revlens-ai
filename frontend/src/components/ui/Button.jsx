import React from "react"

/**
 * @typedef {Object} ButtonProps
 * @property {('primary'|'secondary'|'danger'|'ghost')} [variant='primary'] - Visual style variant of the button
 * @property {('sm'|'md'|'lg')} [size='md'] - Button size
 * @property {boolean} [isLoading=false] - Show a loading spinner and disable the button
 * @property {React.ReactNode} [icon] - Icon component to display
 * @property {('left'|'right')} [iconPosition='left'] - Position of the icon relative to children
 * @property {React.ReactNode} [children] - Content inside the button
 * @property {string} [className=''] - Additional CSS classes
 */

/**
 * A highly customizable, theme-aware Button component with loading and icon support.
 * @param {ButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export default function Button({
  variant = "primary",
  size = "md",
  isLoading = false,
  icon,
  iconPosition = "left",
  fullWidth = false,
  children,
  className = "",
  disabled,
  ...props
}) {
  const baseStyle = `inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer ${fullWidth ? "w-full" : ""}`
  
  const variants = {
    primary: "bg-(--color-brand-600) text-white hover:bg-(--color-brand-700) focus:ring-(--color-brand-500) shadow-sm hover:shadow-md hover:-translate-y-0.5",
    secondary: "bg-white dark:bg-(--color-surface-elevated-dark) text-(--color-brand-600) dark:text-white border border-(--color-border) dark:border-(--color-border-dark) hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) focus:ring-(--color-brand-500) shadow-sm hover:shadow-md hover:-translate-y-0.5",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    ghost: "bg-transparent text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) focus:ring-(--color-brand-500)",
    custom: ""
  }

  const sizes = {
    sm: "px-4 py-2 text-sm gap-1.5 min-h-[36px]",
    md: "px-5 py-2.5 sm:py-3 text-sm gap-2 min-h-[44px]",
    lg: "px-6 py-3.5 text-base gap-2.5 min-h-[52px]"
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current shrink-0"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}

      {!isLoading && icon && iconPosition === "left" && (
        <span className="shrink-0">{icon}</span>
      )}
      
      <span>{children}</span>
      
      {!isLoading && icon && iconPosition === "right" && (
        <span className="shrink-0">{icon}</span>
      )}
    </button>
  )
}
