import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

function extractRecoveryTokensFromUrl() {
  const href = window.location.href

  const hashAccessIndex = href.indexOf("#access_token=")
  if (hashAccessIndex === -1) {
    return null
  }

  const tokenFragment = href.slice(hashAccessIndex + 1)
  const params = new URLSearchParams(tokenFragment)

  const access_token = params.get("access_token")
  const refresh_token = params.get("refresh_token")
  const type = params.get("type")

  if (!access_token || !refresh_token) {
    return null
  }

  return {
    access_token,
    refresh_token,
    type,
  }
}

export default function ResetPasswordPage() {
  const navigate = useNavigate()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [hasRecoverySession, setHasRecoverySession] = useState(false)

  useEffect(() => {
    let mounted = true

    async function initializeRecoverySession() {
      try {
        const tokens = extractRecoveryTokensFromUrl()

        if (tokens?.type === "recovery") {
          const { error } = await supabase.auth.setSession({
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
          })

          if (error) {
            console.error("Failed to set recovery session from URL:", error)

            if (mounted) {
              setErrorMessage(
                "This password reset link is invalid or expired. Please request a new one."
              )
              setHasRecoverySession(false)
              setIsCheckingSession(false)
            }
            return
          }

          if (mounted) {
            setHasRecoverySession(true)
            setErrorMessage("")
            setIsCheckingSession(false)
          }
          return
        }

        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Failed to check recovery session:", error)

          if (mounted) {
            setErrorMessage(
              "Unable to verify reset session. Please request a new password reset link."
            )
            setHasRecoverySession(false)
            setIsCheckingSession(false)
          }
          return
        }

        if (data.session) {
          if (mounted) {
            setHasRecoverySession(true)
            setErrorMessage("")
            setIsCheckingSession(false)
          }
          return
        }

        if (mounted) {
          setErrorMessage(
            "This password reset link is invalid or expired. Please request a new one."
          )
          setHasRecoverySession(false)
          setIsCheckingSession(false)
        }
      } catch (error) {
        console.error("Unexpected recovery setup error:", error)

        if (mounted) {
          setErrorMessage(
            "Unable to verify reset session. Please request a new password reset link."
          )
          setHasRecoverySession(false)
          setIsCheckingSession(false)
        }
      }
    }

    initializeRecoverySession()

    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setMessage("")
    setErrorMessage("")

    const trimmedPassword = password.trim()
    const trimmedConfirmPassword = confirmPassword.trim()

    if (!trimmedPassword || !trimmedConfirmPassword) {
      setErrorMessage("Please complete both password fields.")
      return
    }

    if (trimmedPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.")
      return
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      setErrorMessage("Passwords do not match.")
      return
    }

    if (!hasRecoverySession) {
      setErrorMessage(
        "This password reset link is invalid or expired. Please request a new one."
      )
      return
    }

    setIsSubmitting(true)

    const { error } = await supabase.auth.updateUser({
      password: trimmedPassword,
    })

    setIsSubmitting(false)

    if (error) {
      console.error("Failed to update password:", error)
      setErrorMessage(error.message || "Unable to update password.")
      return
    }

    setMessage("Password updated successfully. Redirecting to login...")

    setTimeout(() => {
      navigate("/login", { replace: true })
    }, 1500)
  }

  const showInvalidLinkState =
    !isCheckingSession && !hasRecoverySession && !message

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]"
      >
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>

          <h1 className="mt-2 text-lg font-semibold text-white">
            Reset Password
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Enter your new password below.
          </p>
        </div>

        {message && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {errorMessage}
          </div>
        )}

        {isCheckingSession && (
          <div className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-slate-300">
            Verifying reset link...
          </div>
        )}

        {!isCheckingSession && hasRecoverySession && !message && (
          <>
            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                New Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-sm opacity-70 transition hover:opacity-100"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                Confirm New Password
              </label>

              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  className="absolute right-3 top-3 text-sm opacity-70 transition hover:opacity-100"
                  aria-label={
                    showConfirmPassword ? "Hide password" : "Show password"
                  }
                >
                  {showConfirmPassword ? "🙈" : "👁️"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </>
        )}

        {showInvalidLinkState && (
          <div className="space-y-3">
            <Link
              to="/forgot-password"
              className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
            >
              Request New Reset Link
            </Link>
          </div>
        )}

        <div className="text-center">
          <Link
            to="/login"
            className="text-xs font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  )
}