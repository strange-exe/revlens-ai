import { NavLink } from "react-router-dom"
import { LayoutDashboard, MessageSquareText, BarChart3 } from "lucide-react"

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText, end: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, end: false },
]

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 hidden md:block">
      <div className="p-4 space-y-1">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"}`
            }
          >
            <l.icon size={18} />
            {l.label}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}
