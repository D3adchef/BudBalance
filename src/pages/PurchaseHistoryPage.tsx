import { useMemo, useState } from "react"
import PurchaseHistoryItem from "../components/PurchaseHistoryItem"
import SectionCard from "../components/SectionCard"
import PageIntroPopup from "../components/PageIntroPopup"
import { usePurchaseStore } from "../features/purchases/purchaseStore"

export default function PurchaseHistoryPage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
  }, [purchases])

  const recentPurchases = sortedPurchases.slice(0, 3)
  const olderPurchases = sortedPurchases.slice(3, 100)

  const [openRecentIds, setOpenRecentIds] = useState<string[]>([])
  const [selectedOlderId, setSelectedOlderId] = useState("")
  const [isOlderOpen, setIsOlderOpen] = useState(false)

  const selectedOlderPurchase =
    olderPurchases.find((purchase) => purchase.id === selectedOlderId) ?? null

  function toggleRecentPurchase(purchaseId: string) {
    setOpenRecentIds((current) =>
      current.includes(purchaseId)
        ? current.filter((id) => id !== purchaseId)
        : [...current, purchaseId]
    )
  }

  function handleOlderSelection(purchaseId: string) {
    setSelectedOlderId(purchaseId)
    setIsOlderOpen(false)
  }

  function toggleOlderPurchase() {
    setIsOlderOpen((current) => !current)
  }

  return (
    <>
      <PageIntroPopup
        pageKey="purchase-history"
        title="Purchase History"
        description="Review your saved purchases and open any entry to see product details and grams used. Older purchases stay here for reference, even after they roll out of your active 31-day window."
      />

      <div className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">
            Purchase History
          </h1>
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
          {recentPurchases.length > 0 ? (
            <div className="space-y-2.5">
              {recentPurchases.map((purchase) => (
                <PurchaseHistoryItem
                  key={purchase.id}
                  purchaseDate={purchase.purchaseDate}
                  dispensary={purchase.dispensary}
                  source={purchase.source}
                  items={purchase.items}
                  isOpen={openRecentIds.includes(purchase.id)}
                  onToggle={() => toggleRecentPurchase(purchase.id)}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
              No purchases saved yet.
            </div>
          )}
        </SectionCard>

        <SectionCard title="Older Purchases">
          {olderPurchases.length > 0 ? (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Select Purchase Date
                </label>

                <select
                  value={selectedOlderId}
                  onChange={(e) => handleOlderSelection(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                >
                  <option value="">Select date</option>
                  {olderPurchases.map((purchase) => (
                    <option key={purchase.id} value={purchase.id}>
                      {purchase.purchaseDate}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOlderPurchase && (
                <PurchaseHistoryItem
                  key={selectedOlderPurchase.id}
                  purchaseDate={selectedOlderPurchase.purchaseDate}
                  dispensary={selectedOlderPurchase.dispensary}
                  source={selectedOlderPurchase.source}
                  items={selectedOlderPurchase.items}
                  isOpen={isOlderOpen}
                  onToggle={toggleOlderPurchase}
                />
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
              No older purchases available.
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
    </>
  )
}