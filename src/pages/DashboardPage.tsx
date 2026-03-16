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
  const purchaseCount = purchases.length
  const avgPurchase =
    purchaseCount > 0 ? (usedGrams / purchaseCount).toFixed(1) : "0.0"

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-900 p-4 shadow-lg shadow-emerald-950/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Current Balance
            </p>
            <h2 className="mt-2 text-4xl font-bold tracking-tight text-white">
              {remainingGrams}g
            </h2>
            <p className="mt-1 text-xs text-slate-300">
              Available to purchase right now
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-right">
            <p className="text-[11px] text-slate-400">Used</p>
            <p className="text-xl font-semibold text-white">{usedGrams}g</p>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>31-day allotment usage</span>
            <span>{Math.round(percentUsed)}%</span>
          </div>

          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/90">
            <div
              className="h-full rounded-full bg-emerald-400 transition-all"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Total Purchases
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {purchaseCount}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Avg Purchase
            </p>
            <p className="mt-1 text-lg font-semibold text-white">
              {avgPurchase}g
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <QuickActionButton to="/add-purchase" label="Add Purchase" />
        <QuickActionButton to="/tools" label="Smart Planner" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Used
          </p>
          <p className="mt-1 text-xl font-semibold text-white">{usedGrams}g</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-3 py-3 shadow-sm">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Remaining
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">
            {remainingGrams}g
          </p>
        </div>
      </div>

      <SectionCard title="Allotment Returning">
        <div className="space-y-2">
          {upcomingRollOffs.length > 0 ? (
            upcomingRollOffs.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2.5"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-medium text-white">
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {item.rollOffDate}
                  </p>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
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
        <div className="space-y-2">
          {recentPurchases.length > 0 ? (
            recentPurchases.map((purchase) => (
              <div
                key={purchase.id}
                className="flex items-center justify-between rounded-2xl border border-white/5 bg-slate-900/60 px-3 py-2.5"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-medium text-white">
                    {purchase.productName}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {purchase.purchaseDate}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold text-white">
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