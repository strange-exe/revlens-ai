import { NavLink } from "react-router-dom"
import { LayoutDashboard, MessageSquareText, BarChart3 } from "lucide-react"

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText, end: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, end: false },
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-[--color-border] dark:border-[--color-border-dark] bg-[--color-surface] dark:bg-[--color-surface-dark] hidden md:flex flex-col">
      <div className="flex items-center gap-2 px-5 h-16 border-b border-[--color-border] dark:border-[--color-border-dark]">
        <span className="w-6 h-6 rounded-md bg-[--color-brand-500] flex items-center justify-center text-white text-[10px] font-bold">R</span>
        <span className="font-heading text-sm font-bold text-[--color-brand-600] dark:text-[--color-brand-300]">RevLens</span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive ? "bg-[--color-brand-100] dark:bg-[--color-brand-800] text-[--color-brand-600] dark:text-[--color-gold-400]" : "text-[--color-muted] dark:text-[--color-muted-dark] hover:bg-white dark:hover:bg-[--color-surface-elevated-dark] hover:text-[--color-brand-500] dark:hover:text-white"}`
            }
          >
            <l.icon size={16} />
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
