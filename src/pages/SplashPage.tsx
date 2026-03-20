import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import bbLogin from "../assets/BBLogin.png"
import { useAuthStore } from "../features/auth/authStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

export default function SplashPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const hasCompletedInitialSetup = useAllotmentStore(
    (state) => state.allotment.hasCompletedInitialSetup
  )
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setFadeOut(true)
    }, 2300)

    const navigateTimer = window.setTimeout(() => {
      if (!currentUser) {
        navigate("/login", { replace: true })
        return
      }

      if (!hasCompletedInitialSetup) {
        navigate("/first-time-allotment-setup", { replace: true })
        return
      }

      navigate("/dashboard", { replace: true })
    }, 3000)

    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(navigateTimer)
    }
  }, [navigate, currentUser, hasCompletedInitialSetup])

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