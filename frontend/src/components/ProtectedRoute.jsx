import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { Loader } from "./ui"

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <Loader fullPage variant="dots" text="Loading session..." />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
