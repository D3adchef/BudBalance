import type { ReactNode } from "react"
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import BottomNavLink from "./BottomNavLink"

type Props = {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)
  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )
  const navigate = useNavigate()

  useEffect(() => {
    loadPurchasesForCurrentUser()
  }, [currentUser, loadPurchasesForCurrentUser])

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-900 shadow-2xl shadow-black/40">
        <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="px-4 pb-3 pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
                  BudBalance
                </p>
                <h1 className="mt-1 text-lg font-semibold text-white">
                  Allotment Tracker
                </h1>
                <p className="mt-1 text-xs text-slate-400">
                  {currentUser ? `Logged in as ${currentUser}` : "Not logged in"}
                </p>
              </div>

              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-slate-700"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5">{children}</main>

        <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-800 bg-slate-900/95 backdrop-blur">
          <div className="mx-auto grid max-w-md grid-cols-5 gap-1 px-2 pb-4 pt-2">
            <BottomNavLink to="/" label="Home" icon="🏠" />
            <BottomNavLink to="/timeline" label="Timeline" icon="📆" />
            <BottomNavLink to="/add-purchase" label="Add" icon="➕" />
            <BottomNavLink to="/purchase-history" label="History" icon="🧾" />
            <BottomNavLink to="/tools" label="Tools" icon="🧠" />
          </div>
        </nav>
      </div>
    </div>
  )
}