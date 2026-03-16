import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"

export default function SignupPage() {
  const signup = useAuthStore((state) => state.signup)
  const navigate = useNavigate()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    const result = signup(username, password)
    setMessage(result.message)

    if (result.success) {
      navigate("/")
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-800 p-6 space-y-5">
        <div>
          <p className="text-sm text-slate-400">BudBalance</p>
          <h1 className="mt-1 text-2xl font-bold">Create Account</h1>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
              placeholder="Create a username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm text-slate-300">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-white outline-none focus:border-emerald-500"
              placeholder="Create a password"
            />
          </div>

          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold hover:bg-emerald-500 transition"
          >
            Sign Up
          </button>
        </form>

        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="text-emerald-400 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}