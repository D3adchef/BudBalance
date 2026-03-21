import { useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "../lib/supabase"

function buildResetRedirectUrl() {
  const origin = window.location.origin
  const path = window.location.pathname.endsWith("/")
    ? window.location.pathname
    : `${window.location.pathname}/`

  return `${origin}${path}#/reset-password`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState("")
  const [errorMessage, setErrorMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    setIsSubmitting(true)
    setMessage("")
    setErrorMessage("")

    const redirectTo = buildResetRedirectUrl()

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim().toLowerCase(),
      {
        redirectTo,
      }
    )

    setIsSubmitting(false)

    if (error) {
      console.error("Failed to send password reset email:", error)
      setErrorMessage(error.message || "Unable to send reset email.")
      return
    }

    setMessage("Password reset email sent. Please check your inbox.")
    setEmail("")
  }

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
            Forgot Password
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Enter your email and we will send you a reset link.
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

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter account email"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>

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