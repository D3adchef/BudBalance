import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

export default function LoginPage() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const success = login(username, password)

    if (success) {
      navigate("/")
    } else {
      alert("Invalid username or password")
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

        {/* Username */}
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Username
          </label>

          <input
            type="text"
            placeholder="Enter username"
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Password
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-sm opacity-70 transition hover:opacity-100"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
        >
          Login
        </button>

        {/* Signup Link */}
        <p className="text-center text-sm text-slate-400">
          Don’t have an account?{" "}
          <Link
            to="/signup"
            className="font-medium text-emerald-400 transition hover:text-emerald-300"
          >
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}