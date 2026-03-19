import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

function isStrongPassword(password: string) {
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)

  return (
    hasMinLength &&
    hasUppercase &&
    hasNumber &&
    hasSpecialCharacter
  )
}

export default function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [month, setMonth] = useState("")
  const [day, setDay] = useState("")
  const [year, setYear] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!isStrongPassword(password)) {
      alert(
        "Password must be at least 8 characters and include 1 uppercase letter, 1 number, and 1 special character."
      )
      return
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match.")
      return
    }

    const result = signup({
      firstName,
      lastName,
      username,
      email,
      birthMonth: month,
      birthDay: day,
      birthYear: year,
      mobile: phone,
      password,
    })

    if (result.success) {
      navigate("/first-time-allotment-setup")
    } else {
      alert(result.message)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]"
      >
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>

          <h1 className="mt-2 text-lg font-semibold text-white">
            Create Account
          </h1>

          <p className="mt-1 text-xs text-slate-400">
            Set up your account to track purchases and allotment.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
              First Name
            </label>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
              Last Name *
            </label>
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Username *
          </label>
          <input
            type="text"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Email *
          </label>
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Birthday
          </label>

          <div className="grid grid-cols-3 gap-2">
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">Month</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">Day</option>
              {Array.from({ length: 31 }, (_, i) => (
                <option key={i + 1} value={String(i + 1).padStart(2, "0")}>
                  {i + 1}
                </option>
              ))}
            </select>

            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
            >
              <option value="">Year</option>
              {Array.from({ length: 100 }, (_, i) => {
                const currentYear = new Date().getFullYear()
                const value = String(currentYear - i)
                return (
                  <option key={value} value={value}>
                    {value}
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Mobile Number
          </label>
          <input
            type="tel"
            placeholder="Optional mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Password *
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-sm opacity-70 transition hover:opacity-100"
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <p className="mt-2 text-[11px] leading-4 text-slate-500">
            Password must be at least 8 characters and include 1 uppercase
            letter, 1 number, and 1 special character.
          </p>
        </div>

        <div>
          <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
            Confirm Password *
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-3 py-3 pr-10 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
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

        <p className="text-[11px] leading-4 text-slate-500">
          By tapping Submit, you agree to create a BudBalance account and accept
          our Terms and Privacy Notice. We use the information you provide to
          create your account, support your allotment tracking experience, and
          improve BudBalance over time.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="submit"
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
          >
            Submit
          </button>

          <Link
            to="/login"
            className="flex w-full items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
          >
            Login
          </Link>
        </div>
      </form>
    </div>
  )
}