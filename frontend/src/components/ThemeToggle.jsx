import { Sun, Moon } from "lucide-react"
import { useTheme } from "../context/ThemeContext"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-lg border border-[--color-border] dark:border-[--color-border-dark] hover:bg-white dark:hover:bg-[--color-surface-elevated-dark] cursor-pointer transition-colors text-[--color-muted] dark:text-[--color-muted-dark]"
      aria-label="Toggle dark mode"
    >
      <span className="absolute transition-transform duration-300 rotate-0 dark:rotate-90">
        <Sun size={15} />
      </span>
      <span className="absolute transition-transform duration-300 -rotate-90 dark:rotate-0">
        <Moon size={15} />
      </span>
    </button>
  )
}
