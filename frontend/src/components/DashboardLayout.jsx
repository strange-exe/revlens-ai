import { useState } from "react"
import { Outlet, Link } from "react-router-dom"
import Sidebar from "./Sidebar"
import ThemeToggle from "./ThemeToggle"
import { Menu, Home as HomeIcon, LogOut } from "lucide-react"
import { useProperty } from "../context/PropertyContext"
import { useAuth } from "../context/AuthContext"
import { Select } from "./ui"

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { properties, selectedPropertyId, setSelectedPropertyId } = useProperty()
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-(--color-surface) dark:bg-(--color-surface-dark) transition-colors duration-300">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} logout={logout} />
      
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-(--color-border)/60 dark:border-(--color-border-dark)/60 flex items-center justify-between px-4 sm:px-6 bg-(--color-surface-elevated)/80 dark:bg-(--color-surface-elevated-dark)/80 backdrop-blur-xl shadow-sm dark:shadow-black/5 sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-lg hover:bg-(--color-brand-50) dark:hover:bg-(--color-brand-800) text-(--color-muted) dark:text-(--color-muted-dark) cursor-pointer"
            >
              <Menu size={20} />
            </button>
            <h2 className="font-heading text-base font-bold text-(--color-brand-600) dark:text-white hidden sm:block">Dashboard</h2>
            <span className="hidden sm:inline text-(--color-border) dark:text-(--color-border-dark) font-light">|</span>
            <div className="relative flex items-center">
              <Select
                icon={HomeIcon}
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
                options={[
                  { value: "all", label: "All Properties" },
                  ...properties.map((p) => ({ value: p.id, label: p.name }))
                ]}
                className="w-48 sm:w-56"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {user && (
              <div className="flex items-center gap-2 mr-2">
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.fullName || "User avatar"}
                    className="w-7 h-7 rounded-full object-cover ring-2 ring-(--color-brand-400)/30"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-(--color-brand-100) dark:bg-(--color-brand-800) flex items-center justify-center text-xs font-bold text-(--color-brand-600) dark:text-(--color-brand-300) ring-2 ring-(--color-brand-400)/30">
                    {(user.fullName || user.email || "?").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden lg:inline text-xs font-semibold text-(--color-brand-600) dark:text-white">
                  {user.fullName || user.email.split("@")[0]}
                </span>
              </div>
            )}
            <Link
              to="/"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-(--color-muted) dark:text-(--color-muted-dark) hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            >
              Home
            </Link>
            <a
              href="https://github.com/strange-exe/revlens-ai"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-(--color-brand-500)/10 dark:bg-(--color-brand-500)/20 text-(--color-brand-600) dark:text-(--color-accent-400) border border-(--color-brand-500)/20 dark:border-(--color-accent-500)/30 hover:border-(--color-brand-500)/50 dark:hover:border-(--color-accent-400)/60 hover:bg-(--color-brand-500)/20 transition-all shadow-[0_0_12px_rgba(139,92,246,0.06)] dark:shadow-[0_0_12px_rgba(6,182,212,0.12)] cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12 24 5.37 18.63 0 12 0z"/></svg>
              Source
            </a>
            <button
              onClick={logout}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/20 dark:border-red-500/30 hover:bg-red-500/20 transition-all cursor-pointer"
            >
              <LogOut size={13} />
              Logout
            </button>
            <ThemeToggle />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
