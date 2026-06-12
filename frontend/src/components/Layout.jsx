import { Outlet } from "react-router-dom"
import Navbar from "./Navbar"
import Footer from "./Footer"

export default function Layout() {
  return (
    <div className="min-h-screen bg-(--color-surface) dark:bg-(--color-surface-dark) text-(--color-brand-600) dark:text-white transition-colors duration-300">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
