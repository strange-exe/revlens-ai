import { Outlet, useLocation } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-ink) dark:text-white transition-colors duration-300">
      <Navbar />
      <main key={pathname} className="page-enter">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
