import type { ReactNode } from "react"
import { Navigate } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

type ProtectedRouteProps = {
  children: ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black text-sm text-slate-400">
        Loading...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}