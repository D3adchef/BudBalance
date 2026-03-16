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
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-slate-950 shadow-[0_0_40px_rgba(0,0,0,0.55)] ring-1 ring-white/5">

        {/* Header */}
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/95 backdrop-blur-md">
          <div className="px-4 pb-3 pt-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                    BudBalance
                  </p>
                </div>

                <h1 className="mt-1 truncate text-base font-semibold leading-tight text-white">
                  Allotment Tracker
                </h1>

                <p className="mt-1 truncate text-[11px] text-slate-400">
                  {currentUser ? `Logged in as ${currentUser}` : "Not logged in"}
                </p>
              </div>

              {currentUser && (
                <button
                  onClick={handleLogout}
                  className="shrink-0 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-medium text-slate-200 transition hover:bg-white/10 active:scale-[0.98]"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pb-24 pt-4">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-40 bg-transparent">
          <div className="mx-auto max-w-md px-4 pb-[calc(0.9rem+env(safe-area-inset-bottom))]">
            <div className="grid grid-cols-5 place-items-center rounded-3xl border border-white/10 bg-slate-950/90 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.35)] backdrop-blur-md">
              <BottomNavLink to="/" label="Home" icon="🏠" />
              <BottomNavLink to="/timeline" label="Timeline" icon="📆" />
              <BottomNavLink to="/add-purchase" label="Add" icon="➕" />
              <BottomNavLink to="/purchase-history" label="History" icon="🧾" />
              <BottomNavLink to="/tools" label="Tools" icon="🧠" />
            </div>
          </div>
        </nav>

      </div>
    </div>
  )
}