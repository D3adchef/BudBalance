import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import bbLogin from "../assets/BBLogin.png"
import { useAuthStore } from "../features/auth/authStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

export default function SplashPage() {
  const navigate = useNavigate()

  const currentUser = useAuthStore((state) => state.currentUser)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)

  const hasCompletedInitialSetup = useAllotmentStore(
    (state) => state.allotment.hasCompletedInitialSetup
  )
  const isAllotmentLoading = useAllotmentStore((state) => state.isLoading)

  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    if (!isAuthReady) return

    const minimumDisplayTimer = window.setTimeout(() => {
      if (currentUser && isAllotmentLoading) {
        return
      }

      setFadeOut(true)

      window.setTimeout(() => {
        if (!currentUser) {
          navigate("/login", { replace: true })
          return
        }

        if (!hasCompletedInitialSetup) {
          navigate("/first-time-allotment-setup", { replace: true })
          return
        }

        navigate("/dashboard", { replace: true })
      }, 700)
    }, 1800)

    return () => {
      window.clearTimeout(minimumDisplayTimer)
    }
  }, [
    navigate,
    currentUser,
    isAuthReady,
    hasCompletedInitialSetup,
    isAllotmentLoading,
  ])

  return (
    <div
      className={`flex min-h-screen items-center justify-center bg-black px-4 transition-opacity duration-700 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <img
        src={bbLogin}
        alt="BudBalance"
        className="w-full max-w-sm rounded-3xl shadow-[0_0_35px_rgba(0,0,0,0.85)]"
      />
    </div>
  )
}