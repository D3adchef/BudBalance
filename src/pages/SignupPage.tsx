import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

export default function SignupPage() {
  const navigate = useNavigate()
  const signup = useAuthStore((state) => state.signup)

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const success = signup(username, password)

    if (success) {
      navigate("/")
    } else {
      alert("User already exists")
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-slate-900 p-8 rounded-xl w-80 space-y-5 shadow-lg"
      >
        <h1 className="text-xl font-bold text-center">Create Account</h1>

        {/* Username */}
        <input
          type="text"
          placeholder="Username"
          className="w-full p-2 rounded bg-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />

        {/* Password */}
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full p-2 rounded bg-slate-800 pr-10 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-2 top-2 text-sm opacity-70 hover:opacity-100"
          >
            {showPassword ? "🙈" : "👁️"}
          </button>
        </div>

        {/* Signup Button */}
        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 transition p-2 rounded font-semibold"
        >
          Create Account
        </button>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  )
}