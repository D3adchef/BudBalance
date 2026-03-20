import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useSettingsStore } from "../features/settings/settingsStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"
import BottomNavLink from "./BottomNavLink"

type Props = {
  children: ReactNode
}

export default function AppShell({ children }: Props) {
  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )

  const loadSettingsForCurrentUser = useSettingsStore(
    (state) => state.loadSettingsForCurrentUser
  )

  const loadAllotmentForCurrentUser = useAllotmentStore(
    (state) => state.loadAllotmentForCurrentUser
  )

  useEffect(() => {
    loadPurchasesForCurrentUser()
    loadSettingsForCurrentUser()
    loadAllotmentForCurrentUser()
  }, [
    loadPurchasesForCurrentUser,
    loadSettingsForCurrentUser,
    loadAllotmentForCurrentUser,
  ])

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto w-full max-w-md bg-slate-950 shadow-[0_0_40px_rgba(0,0,0,0.55)] ring-1 ring-white/5">
        <header className="border-b border-white/10 bg-slate-950 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
            BudBalance - Allotment Tracker
          </p>
        </header>

        <main className="px-4 py-4">{children}</main>

        <nav className="border-t border-white/10 bg-slate-950 px-4 py-3">
          <div className="grid grid-cols-5 place-items-center rounded-3xl border border-white/10 bg-slate-950/90 px-3 py-2 shadow-[0_-8px_30px_rgba(0,0,0,0.22)]">
            <BottomNavLink to="/" label="Home" icon="🏠" />

            <BottomNavLink
              to="/smart-planner"
              label="Smart Planner"
              icon="🧠"
            />

            <BottomNavLink
              to="/add-purchase"
              label="Add Purchase"
              icon="➕"
            />

            <BottomNavLink
              to="/purchase-history"
              label="Purchase History"
              icon="🧾"
            />

            <BottomNavLink
              to="/tools"
              label="Tools"
              icon="⚙️"
            />
          </div>
        </nav>
      </div>
    </div>
  )
}