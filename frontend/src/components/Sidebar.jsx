import Logo from "./Logo"
import { NavLink, Link } from "react-router-dom"
import { LayoutDashboard, MessageSquareText, BarChart3, Building, X, Sparkles, Home as HomeIcon, LogOut, Settings } from "lucide-react"

const links = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/properties", label: "Properties", icon: Building, end: false },
  { to: "/dashboard/reviews", label: "Reviews", icon: MessageSquareText, end: false },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3, end: false },
  { to: "/dashboard/assistant", label: "AI Assistant", icon: Sparkles, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: Settings, end: false },
]

export default function Sidebar({ isOpen, onClose, logout }) {
  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-64 md:w-56 border-r border-(--color-border)/60 dark:border-(--color-border-dark)/60 bg-(--color-surface-elevated) dark:bg-(--color-surface-elevated-dark) flex flex-col shadow-xl md:shadow-sm dark:shadow-black/10 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-5 h-16 border-b border-(--color-border)/50 dark:border-(--color-border-dark)/50">
        <Logo size={28} />
        <button 
          type="button"
          aria-label="Close sidebar menu"
          onClick={onClose}
          className="md:hidden p-2 -mr-2 text-(--color-muted) hover:text-(--color-brand-500) dark:text-(--color-muted-dark) dark:hover:text-white rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
        >
          <X size={20} />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-0.5">
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            onClick={() => {
              if (window.innerWidth < 768) {
                onClose && onClose()
              }
            }}
             className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${isActive ? "bg-(--color-brand-100) dark:bg-(--color-brand-800) text-(--color-brand-600) dark:text-(--color-brand-300) font-bold shadow-sm" : "text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-white/50 dark:hover:bg-white/5 hover:text-(--color-brand-500) dark:hover:text-white"}`
             }
          >
            <l.icon size={16} />
            {l.label}
          </NavLink>
        ))}
      </nav>
      {/* Mobile Footer Section (Home & Logout) */}
      <div className="p-3 border-t border-(--color-border)/50 dark:border-(--color-border-dark)/50 space-y-1.5 md:hidden">
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-white/50 dark:hover:bg-white/5 hover:text-(--color-brand-500) dark:hover:text-white transition-colors"
        >
          <HomeIcon size={16} />
          Go to Home
        </Link>
        <button
          type="button"
          onClick={() => {
            onClose && onClose()
            logout && logout()
          }}
          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-500/20 transition-colors w-full text-left cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
