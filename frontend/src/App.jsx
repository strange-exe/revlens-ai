import { useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { AuthProvider } from "./context/AuthContext"
import { PropertyProvider } from "./context/PropertyContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import DashboardLayout from "./components/DashboardLayout"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Reviews from "./pages/Reviews"
import Analytics from "./pages/Analytics"
import About from "./pages/About"
import Login from "./pages/Login"
import Pricing from "./pages/Pricing"
import Assistant from "./pages/Assistant"
import Properties from "./pages/Properties"

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PropertyProvider>
          <BrowserRouter>
            <ScrollToTop />
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="login" element={<Login />} />
              </Route>
              
              {/* Protected Dashboard Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="reviews" element={<Reviews />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="assistant" element={<Assistant />} />
                  <Route path="properties" element={<Properties />} />
                </Route>
              </Route>
            </Routes>
          </BrowserRouter>
        </PropertyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
