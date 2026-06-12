import { Search } from "lucide-react"

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative group">
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-(--color-muted) dark:text-(--color-muted-dark) transition-colors group-focus-within:text-(--color-brand-500)" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-(--color-surface-elevated-dark) border border-(--color-border) dark:border-(--color-border-dark) text-sm text-(--color-brand-600) dark:text-white placeholder:text-(--color-muted)/40 focus:outline-none focus:ring-2 focus:ring-(--color-brand-400)/30 focus:border-(--color-brand-400) dark:focus:border-(--color-brand-400) transition-all shadow-sm dark:shadow-black/20"
      />
    </div>
  )
}
