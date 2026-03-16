import PurchaseHistoryItem from "../components/PurchaseHistoryItem"
import SectionCard from "../components/SectionCard"
import { usePurchaseStore } from "../features/purchases/purchaseStore"

export default function PurchaseHistoryPage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
          BudBalance
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">
          Purchase History
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Review saved purchases and recent allotment activity.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Saved Purchases
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {purchases.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Tracking Window
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">31 Days</p>
        </div>
      </div>

      <SectionCard title="Saved Purchases">
        {purchases.length > 0 ? (
          <div className="space-y-2.5">
            {purchases.map((purchase) => (
              <PurchaseHistoryItem
                key={purchase.id}
                productName={purchase.productName}
                grams={purchase.grams}
                purchaseDate={purchase.purchaseDate}
                dispensary={purchase.dispensary}
                source={purchase.source}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
            No purchases saved yet.
          </div>
        )}
      </SectionCard>

      <SectionCard title="History Rules">
        <div className="grid gap-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              Full product details are stored for reference and history.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              Only grams affect allotment calculations.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              Purchases roll out of the active window after 31 days.
            </p>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}