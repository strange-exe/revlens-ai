import { BrowserRouter, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./context/ThemeContext"
import Layout from "./components/Layout"
import DashboardLayout from "./components/DashboardLayout"
import Home from "./pages/Home"
import Dashboard from "./pages/Dashboard"
import Reviews from "./pages/Reviews"
import Analytics from "./pages/Analytics"
import About from "./pages/About"
import Login from "./pages/Login"
import Pricing from "./pages/Pricing"

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="about" element={<About />} />
            <Route path="pricing" element={<Pricing />} />
            <Route path="login" element={<Login />} />
          </Route>
          <Route path="dashboard" element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="analytics" element={<Analytics />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
