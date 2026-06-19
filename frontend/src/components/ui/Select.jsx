import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

export default function Select({ value, onChange, options, icon: Icon, className = "", dropdownClassName = "" }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const selectedOption = options.find(o => String(o.value) === String(value)) || options[0]

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between appearance-none bg-black/5 dark:bg-white/5 backdrop-blur-md border border-(--color-border) dark:border-white/10 text-xs font-semibold rounded-xl px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-(--color-brand-400)/40 focus:border-(--color-brand-400) text-(--color-brand-600) dark:text-white transition-all cursor-pointer min-h-[36px] hover:bg-black/10 dark:hover:bg-white/10"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {Icon && <Icon size={14} className="shrink-0 text-(--color-muted) dark:text-(--color-muted-dark)" />}
          <span className="truncate">{selectedOption?.label}</span>
        </div>
        <ChevronDown 
          size={14} 
          className={`shrink-0 text-(--color-muted) dark:text-(--color-muted-dark) transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-1 w-full min-w-[200px] right-0 rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-white/10 shadow-xl dark:shadow-black/20 overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 ${dropdownClassName}`}>
          <div className="max-h-60 overflow-y-auto p-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  String(option.value) === String(value)
                    ? "bg-(--color-brand-50) dark:bg-(--color-brand-500)/10 text-(--color-brand-600) dark:text-(--color-brand-400) font-bold"
                    : "text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-black/5 dark:hover:bg-white/5 hover:text-(--color-brand-500) dark:hover:text-white"
                }`}
              >
                <span className="truncate pr-2">{option.label}</span>
                {String(option.value) === String(value) && (
                  <Check size={14} className="shrink-0 text-(--color-brand-600) dark:text-(--color-brand-400)" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
