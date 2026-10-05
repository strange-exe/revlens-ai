import { lazy, Suspense, useEffect } from "react"
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import { AuthProvider } from "./context/AuthContext"
import { PropertyProvider } from "./context/PropertyContext"
import ProtectedRoute from "./components/ProtectedRoute"
import Layout from "./components/Layout"
import Loader from "./components/ui/Loader"
import Home from "./pages/Home"
import { PAGE_IMPORTS } from "./routes"

// The landing page ships in the main bundle (first paint); every other route is its own chunk,
// so visitors don't download the dashboard and hosts don't download the marketing pages.
const DashboardLayout = lazy(() => import("./components/DashboardLayout"))
const Dashboard = lazy(PAGE_IMPORTS.Dashboard)
const Reviews = lazy(PAGE_IMPORTS.Reviews)
const Analytics = lazy(PAGE_IMPORTS.Analytics)
const About = lazy(() => import("./pages/About"))
const Login = lazy(() => import("./pages/Login"))
const Pricing = lazy(() => import("./pages/Pricing"))
const Assistant = lazy(PAGE_IMPORTS.Assistant)
const Properties = lazy(PAGE_IMPORTS.Properties)

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
            <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><Loader size="md" /></div>}>
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
            </Suspense>
          </BrowserRouter>
        </PropertyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
