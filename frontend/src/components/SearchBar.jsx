import { Search } from "lucide-react"

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[--color-muted] dark:text-[--color-muted-dark]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface-elevated] dark:bg-[--color-surface-elevated-dark] text-sm text-[--color-brand-600] dark:text-white placeholder:text-[--color-muted]/50 focus:outline-none focus:border-[--color-brand-400] dark:focus:border-[--color-brand-500] focus:ring-1 focus:ring-[--color-brand-400]/20 dark:focus:ring-[--color-brand-500]/20 transition-colors"
      />
    </div>
  )
}
