import { Sun, Moon } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg bg-(--color-brand-100) dark:bg-(--color-brand-800) hover:bg-(--color-brand-200) dark:hover:bg-(--color-brand-700) cursor-pointer transition-all text-(--color-brand-600) dark:text-(--color-gold-400) shadow-sm border border-(--color-brand-200) dark:border-(--color-brand-700)"
      aria-label="Toggle dark mode"
    >
      <span className="absolute transition-all duration-500 rotate-0 dark:rotate-180 opacity-100 dark:opacity-0">
        <Sun size={15} />
      </span>
      <span className="absolute transition-all duration-500 -rotate-180 dark:rotate-0 opacity-0 dark:opacity-100">
        <Moon size={15} />
      </span>
    </button>
  )
}
