import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import SplashScreen from "../components/SplashScreen"
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

  return <SplashScreen fadeOut={fadeOut} />
}