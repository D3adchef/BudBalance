import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    const result = await login(email, password)

    setIsSubmitting(false)

    if (result.success) {
      navigate("/dashboard", { replace: true })
    } else {
      alert(result.message)
    }
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
            Account Login
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Sign in to access your allotment tracker.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Email
          </label>

          <input
            type="email"
            placeholder="Enter email"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="block text-[11px] uppercase tracking-wide text-slate-400">
              Password
            </label>

            <Link
              to="/forgot-password"
              className="text-[11px] font-medium text-emerald-400 transition hover:text-emerald-300"
            >
              Forgot Password?
            </Link>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
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

        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Logging In..." : "Login"}
          </button>

          <Link
            to="/signup"
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
          >
            Create Account
          </Link>
        </div>

        <p className="text-center text-xs text-slate-500">
          Secure access to your personal allotment tracker.
        </p>
      </form>
    </div>
  )
}