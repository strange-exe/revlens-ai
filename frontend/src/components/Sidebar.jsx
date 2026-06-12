import { NavLink } from "react-router-dom"
import { LayoutDashboard, MessageSquareText, BarChart3 } from "lucide-react"

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText, end: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, end: false },
]

export default function Sidebar() {
  return (
    <aside className="w-56 border-r border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface-elevated)/80 dark:bg-(--color-surface-elevated-dark)/80 backdrop-blur-xl hidden md:flex flex-col shadow-sm dark:shadow-black/10">
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-(--color-border)/50 dark:border-(--color-border-dark)/50">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-(--color-brand-400) to-(--color-brand-600) flex items-center justify-center text-white text-[10px] font-bold shadow-sm">
          R
        </div>
        <span className="font-heading text-sm font-bold">
          <span className="text-(--color-brand-600) dark:text-white">Rev</span>
          <span className="text-(--color-gold-500) dark:text-(--color-gold-400)">Lens</span>
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
             className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive ? "bg-(--color-brand-100) dark:bg-(--color-brand-800) text-(--color-brand-600) dark:text-(--color-gold-400) font-bold shadow-sm" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-white/50 dark:hover:bg-white/5 hover:text-(--color-brand-500) dark:hover:text-white"}`
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
