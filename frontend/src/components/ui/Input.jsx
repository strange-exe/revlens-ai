import React from "react"

/**
 * @typedef {Object} InputProps
 * @property {string} [label] - Input label text
 * @property {string} [error] - Error message text (shows red text & outline)
 * @property {string} [helperText] - Helper text below the input field
 * @property {React.ReactNode} [icon] - Icon component to display inside the input on the left
 * @property {boolean} [fullWidth=false] - If true, the input container takes up 100% width
 * @property {string} [className=''] - Additional CSS classes for the input element
 */

/**
 * A beautiful, theme-aware text input field component with validation and icon support.
 * @param {InputProps & React.InputHTMLAttributes<HTMLInputElement>} props
 */
export default function Input({
  label,
  error,
  helperText,
  icon,
  fullWidth = false,
  className = "",
  id,
  type = "text",
  ...props
}) {
  const inputId = id || React.useId()

  return (
    <div className={`flex flex-col gap-1.5 ${fullWidth ? "w-full" : "w-fit"}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-(--color-muted) dark:text-(--color-muted-dark)"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-(--color-muted) dark:text-(--color-muted-dark) shrink-0 pointer-events-none">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`
            px-4 py-3 rounded-xl text-sm border bg-white dark:bg-(--color-surface-elevated-dark) text-(--color-brand-600) dark:text-white transition-all duration-200 outline-none
            ${icon ? "pl-11" : ""}
            ${fullWidth ? "w-full" : "w-full sm:w-80"}
            ${error 
              ? "border-red-500 focus:ring-2 focus:ring-red-500/20 focus:border-red-500" 
              : "border-(--color-border) dark:border-(--color-border-dark) focus:ring-2 focus:ring-(--color-brand-400)/20 focus:border-(--color-brand-400)"
            }
            ${className}
          `}
          {...props}
        />
      </div>

      {error && (
        <span className="text-xs text-red-500 font-medium leading-none">
          {error}
        </span>
      )}

      {!error && helperText && (
        <span className="text-xs text-(--color-muted)/70 dark:text-(--color-muted-dark)/70 leading-none">
          {helperText}
        </span>
      )}
    </div>
  )
}
