import { useMemo, useState } from "react"
import PurchaseHistoryItem from "../components/PurchaseHistoryItem"
import PageIntroPopup from "../components/PageIntroPopup"
import { usePurchaseStore } from "../features/purchases/purchaseStore"

type OpenSection = "saved" | "older" | "rules" | null

function getEntryModeLabel(entryMode?: string) {
  switch (entryMode) {
    case "setup":
      return "Setup Entry"
    case "scan":
      return "Scanned Entry"
    case "historical":
      return "History Only"
    case "manual":
    default:
      return "Manual Entry"
  }
}

function formatPurchaseLabel(purchase: {
  purchaseDate: string
  dispensary: string
  entryMode?: string
}) {
  const dispensaryLabel = purchase.dispensary?.trim() || "Unknown dispensary"
  return `${purchase.purchaseDate} • ${dispensaryLabel} • ${getEntryModeLabel(
    purchase.entryMode
  )}`
}

function CollapseHeader({
  title,
  isOpen,
  onClick,
}: {
  title: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left transition hover:border-emerald-500/30"
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="text-lg font-semibold text-emerald-400">
        {isOpen ? "−" : "+"}
      </span>
    </button>
  )
}

export default function PurchaseHistoryPage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  const [openSection, setOpenSection] = useState<OpenSection>("saved")
  const [selectedSavedId, setSelectedSavedId] = useState("")
  const [selectedOlderId, setSelectedOlderId] = useState("")
  const [selectedPurchaseFilter, setSelectedPurchaseFilter] = useState("")
  const [selectedDispensaryFilter, setSelectedDispensaryFilter] = useState("")

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort((a, b) =>
      b.purchaseDate.localeCompare(a.purchaseDate)
    )
  }, [purchases])

  const countingPurchases = useMemo(
    () => purchases.filter((purchase) => purchase.countsTowardAllotment).length,
    [purchases]
  )

  const historyOnlyPurchases = useMemo(
    () => purchases.filter((purchase) => !purchase.countsTowardAllotment).length,
    [purchases]
  )

  const uniqueDispensaries = useMemo(() => {
    return Array.from(
      new Set(
        purchases
          .map((purchase) => purchase.dispensary?.trim() || "")
          .filter(Boolean)
      )
    ).sort((a, b) => a.localeCompare(b))
  }, [purchases])

  const filteredPurchases = useMemo(() => {
    return sortedPurchases.filter((purchase) => {
      const matchesPurchase =
        !selectedPurchaseFilter || purchase.id === selectedPurchaseFilter

      const matchesDispensary =
        !selectedDispensaryFilter ||
        (purchase.dispensary?.trim() || "") === selectedDispensaryFilter

      return matchesPurchase && matchesDispensary
    })
  }, [sortedPurchases, selectedPurchaseFilter, selectedDispensaryFilter])

  const savedPurchases = filteredPurchases.slice(0, 3)
  const olderPurchases = filteredPurchases.slice(3)

  const selectedSavedPurchase =
    savedPurchases.find((purchase) => purchase.id === selectedSavedId) ?? null

  const selectedOlderPurchase =
    olderPurchases.find((purchase) => purchase.id === selectedOlderId) ?? null

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((current) => (current === section ? null : section))
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

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Counts Toward Allotment
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {countingPurchases}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              History Only
            </p>
            <p className="mt-1 text-xl font-semibold text-white">
              {historyOnlyPurchases}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-white">Filters</h2>
            <p className="mt-1 text-xs text-slate-400">
              Filter by purchase or dispensary.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                All Purchases
              </label>
              <select
                value={selectedPurchaseFilter}
                onChange={(e) => {
                  setSelectedPurchaseFilter(e.target.value)
                  setSelectedSavedId("")
                  setSelectedOlderId("")
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="">All purchases</option>
                {sortedPurchases.map((purchase) => (
                  <option key={purchase.id} value={purchase.id}>
                    {formatPurchaseLabel(purchase)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Dispensary
              </label>
              <select
                value={selectedDispensaryFilter}
                onChange={(e) => {
                  setSelectedDispensaryFilter(e.target.value)
                  setSelectedSavedId("")
                  setSelectedOlderId("")
                }}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
              >
                <option value="">All dispensaries</option>
                {uniqueDispensaries.map((dispensary) => (
                  <option key={dispensary} value={dispensary}>
                    {dispensary}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <CollapseHeader
            title="Saved Purchases"
            isOpen={openSection === "saved"}
            onClick={() => toggleSection("saved")}
          />

          {openSection === "saved" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
              {savedPurchases.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Select Saved Purchase
                    </label>

                    <select
                      value={selectedSavedId}
                      onChange={(e) => setSelectedSavedId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">Select purchase</option>
                      {savedPurchases.map((purchase) => (
                        <option key={purchase.id} value={purchase.id}>
                          {formatPurchaseLabel(purchase)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedSavedPurchase && (
                    <PurchaseHistoryItem
                      key={selectedSavedPurchase.id}
                      purchaseDate={selectedSavedPurchase.purchaseDate}
                      dispensary={selectedSavedPurchase.dispensary}
                      source={selectedSavedPurchase.source}
                      items={selectedSavedPurchase.items}
                      isOpen
                      onToggle={() => setSelectedSavedId("")}
                      countsTowardAllotment={
                        selectedSavedPurchase.countsTowardAllotment
                      }
                      entryMode={selectedSavedPurchase.entryMode}
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
                  No saved purchases found for the current filters.
                </div>
              )}
            </div>
          )}

          <CollapseHeader
            title="Older Purchases"
            isOpen={openSection === "older"}
            onClick={() => toggleSection("older")}
          />

          {openSection === "older" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
              {olderPurchases.length > 0 ? (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Select Older Purchase
                    </label>

                    <select
                      value={selectedOlderId}
                      onChange={(e) => setSelectedOlderId(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    >
                      <option value="">Select purchase</option>
                      {olderPurchases.map((purchase) => (
                        <option key={purchase.id} value={purchase.id}>
                          {formatPurchaseLabel(purchase)}
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
                      isOpen
                      onToggle={() => setSelectedOlderId("")}
                      countsTowardAllotment={
                        selectedOlderPurchase.countsTowardAllotment
                      }
                      entryMode={selectedOlderPurchase.entryMode}
                    />
                  )}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
                  No older purchases found for the current filters.
                </div>
              )}
            </div>
          )}

          <CollapseHeader
            title="History Rules"
            isOpen={openSection === "rules"}
            onClick={() => toggleSection("rules")}
          />

          {openSection === "rules" && (
            <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
              <div className="grid gap-2">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    Full product details are stored for reference and history.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    Purchases marked as History Only stay saved but do not reduce
                    your current allotment.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    Purchases that count toward allotment roll out of the active
                    window after 31 days.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}