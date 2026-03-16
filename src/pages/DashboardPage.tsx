import QuickActionButton from "../components/QuickActionButton"
import SectionCard from "../components/SectionCard"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import {
  getRecentPurchases,
  getRemainingGrams,
  getUpcomingRollOffs,
  getUsedGrams,
} from "../utils/allotment"

export default function DashboardPage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  const usedGrams = getUsedGrams(purchases)
  const remainingGrams = getRemainingGrams(purchases)
  const upcomingRollOffs = getUpcomingRollOffs(purchases).slice(0, 3)
  const recentPurchases = getRecentPurchases(purchases, 3)

  const percentUsed = Math.min((usedGrams / 84) * 100, 100)

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-900 to-slate-800 p-5 shadow-lg shadow-emerald-950/20">
        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">
          Current Balance
        </p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-5xl font-bold tracking-tight text-white">
              {remainingGrams}g
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Available to purchase right now
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-right">
            <p className="text-xs text-slate-400">Used</p>
            <p className="text-2xl font-semibold text-white">{usedGrams}g</p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
            <span>31-day allotment usage</span>
            <span>{Math.round(percentUsed)}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton to="/add-purchase" label="Add Purchase" />
        <QuickActionButton to="/tools" label="Smart Planner" />
      </div>

      <SectionCard title="Allotment Returning">
        <div className="space-y-3">
          {upcomingRollOffs.length > 0 ? (
            upcomingRollOffs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {item.productName}
                  </p>
                  <p className="text-xs text-slate-400">{item.rollOffDate}</p>
                </div>
                <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-sm font-semibold text-emerald-400">
                  +{item.grams}g
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No active purchases in the current window.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Recent Purchases">
        <div className="space-y-3">
          {recentPurchases.length > 0 ? (
            recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between rounded-2xl bg-slate-900/60 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-white">
                    {purchase.productName}
                  </p>
                  <p className="text-xs text-slate-400">
                    {purchase.purchaseDate}
                  </p>
                </div>
                <span className="text-sm font-semibold text-white">
                  {purchase.grams}g
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">No purchases saved yet.</p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}