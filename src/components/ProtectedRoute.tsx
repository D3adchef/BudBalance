import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentUser = useAuthStore((state) => state.currentUser)

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}