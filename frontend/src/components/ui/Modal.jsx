import React, { useEffect } from "react"
import { useEffectEvent } from "../../hooks/useEffectEvent"
import { X } from "lucide-react"

const sizeMap = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
}

/**
 * @typedef {Object} ModalProps
 * @property {boolean} isOpen - Control visibility state
 * @property {function} onClose - Callback triggered on closing
 * @property {string} [title] - Header title text
 * @property {React.ReactNode} children - Modal main content
 * @property {React.ReactNode} [footer] - Action footer block
 * @property {('sm'|'md'|'lg'|'xl')} [size='md'] - Max width size profile
 */

/**
 * A highly accessible, animated Modal dialog container.
 * @param {ModalProps} props
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) {
  const onModalClose = useEffectEvent(() => {
    if (onClose) onClose()
  })

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onModalClose()
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Sibling Backdrop button for accessibility */}
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 border-none cursor-pointer w-full h-full"
      />

      {/* Dialog container */}
      <div
        className={`
          relative z-10 w-full ${sizeMap[size]} rounded-2xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) shadow-2xl overflow-hidden transform transition-all duration-300 scale-100 animate-[in_0.2s_ease-out]
        `}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60">
          {title ? (
            <h3 className="font-heading text-lg font-bold text-(--color-brand-600) dark:text-white leading-none">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-(--color-surface-muted) dark:hover:bg-(--color-surface-muted-dark) transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto text-sm text-(--color-brand-600) dark:text-(--color-muted-dark) leading-relaxed">
          {children}
        </div>

        {/* Modal Footer */}
        {footer && (
          <div className="flex justify-end gap-2.5 px-6 py-4 bg-(--color-surface-muted)/30 dark:bg-(--color-surface-muted-dark)/20 border-t border-(--color-border)/60 dark:border-(--color-border-dark)/60">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
