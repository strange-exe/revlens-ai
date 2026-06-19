import React, { useEffect } from "react"
import { CheckCircle, AlertCircle, Info, X } from "lucide-react"

/**
 * @typedef {Object} ToastProps
 * @property {string} message - Content message of the notification alert
 * @property {('success'|'error'|'info'|'warning')} [type='success'] - Alert context type
 * @property {function} onClose - Triggered on manually closing or auto-dismissing
 * @property {number} [duration=3000] - Duration in ms before auto-dismiss
 */

/**
 * A beautiful Toast alert banner component supporting different alert styles.
 * @param {ToastProps} props
 */
export default function Toast({
  message,
  type = "success",
  onClose,
  duration = 3000,
}) {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onClose) onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const types = {
    success: {
      border: "border-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950/20",
      text: "text-emerald-800 dark:text-emerald-300",
      icon: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
    },
    error: {
      border: "border-red-500",
      bg: "bg-red-50 dark:bg-red-950/20",
      text: "text-red-800 dark:text-red-300",
      icon: <AlertCircle size={18} className="text-red-500 shrink-0" />,
    },
    info: {
      border: "border-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950/20",
      text: "text-sky-800 dark:text-sky-300",
      icon: <Info size={18} className="text-sky-500 shrink-0" />,
    },
    warning: {
      border: "border-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950/20",
      text: "text-amber-800 dark:text-amber-300",
      icon: <AlertCircle size={18} className="text-amber-500 shrink-0" />,
    },
  }

  const current = types[type] || types.success

  return (
    <div
      className={`
        flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl border-l-4 ${current.border} ${current.bg} ${current.text} shadow-lg pointer-events-auto max-w-sm transition-all duration-300 animate-[slide-in_0.3s_cubic-bezier(0.16,1,0.3,1)]
      `}
      role="alert"
    >
      {current.icon}
      
      <span className="text-xs font-semibold leading-relaxed flex-1">
        {message}
      </span>

      <button
        onClick={onClose}
        className="p-0.5 rounded-lg text-current hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
        aria-label="Dismiss toast"
      >
        <X size={14} />
      </button>
    </div>
  )
}
