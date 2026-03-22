import { useMemo, useState } from "react"
import PurchaseHistoryItem from "../components/PurchaseHistoryItem"
import PageIntroPopup from "../components/PageIntroPopup"
import {
  type Purchase,
  usePurchaseStore,
} from "../features/purchases/purchaseStore"

type OpenSection = "saved" | "older" | "rules" | null

type PurchaseLike = Purchase

type EditableDraftItem = {
  id: string
  productName: string
  category: string
  grams: string
}

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

function formatTimeLabel(time?: string) {
  if (!time) return "Time not recorded"

  const [hourString = "0", minuteString = "00"] = time.split(":")
  const hour = Number(hourString)
  const minute = Number(minuteString)

  if (Number.isNaN(hour) || Number.isNaN(minute)) return time

  const displayHour = hour % 12 === 0 ? 12 : hour % 12
  const amPm = hour < 12 ? "AM" : "PM"

  return `${displayHour}:${String(minute).padStart(2, "0")} ${amPm}`
}

function getPurchaseSortValue(purchase: PurchaseLike) {
  const fallbackDateTime = `${purchase.purchaseDate}T${purchase.purchaseTime || "12:00"}`
  const resolved = purchase.purchaseDateTime || fallbackDateTime
  const parsed = new Date(resolved).getTime()

  return Number.isNaN(parsed) ? 0 : parsed
}

function formatPurchaseLabel(purchase: {
  purchaseDate: string
  purchaseTime?: string
  dispensary: string
  entryMode?: string
}) {
  const dispensaryLabel = purchase.dispensary?.trim() || "Unknown dispensary"
  return `${purchase.purchaseDate} • ${formatTimeLabel(
    purchase.purchaseTime
  )} • ${dispensaryLabel} • ${getEntryModeLabel(purchase.entryMode)}`
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

function PurchaseMetaCard({ purchase }: { purchase: PurchaseLike }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Purchase Date
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {purchase.purchaseDate || "Not recorded"}
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Purchase Time
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {formatTimeLabel(purchase.purchaseTime)}
          </p>
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Entry Type
          </p>
          <p className="mt-1 text-sm font-medium text-white">
            {getEntryModeLabel(purchase.entryMode)}
          </p>
        </div>
      </div>
    </div>
  )
}

function isPurchaseActive(purchase: PurchaseLike) {
  if (!purchase.countsTowardAllotment) return false

  const now = new Date()
  const purchaseDateTime = new Date(
    purchase.purchaseDateTime || `${purchase.purchaseDate}T${purchase.purchaseTime || "12:00"}`
  )

  if (Number.isNaN(purchaseDateTime.getTime())) return false
  if (purchaseDateTime > now) return false

  const diffMs = now.getTime() - purchaseDateTime.getTime()
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000

  return diffMs < thirtyDaysMs
}

function createEditableItems(purchase: PurchaseLike): EditableDraftItem[] {
  return purchase.items.map((item) => ({
    id: item.id,
    productName: item.productName,
    category: item.category,
    grams: String(item.grams),
  }))
}

function createEmptyEditableItem(): EditableDraftItem {
  return {
    id: crypto.randomUUID(),
    productName: "",
    category: "",
    grams: "",
  }
}

export default function PurchaseHistoryPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const updatePurchase = usePurchaseStore((state) => state.updatePurchase)
  const deletePurchase = usePurchaseStore((state) => state.deletePurchase)

  const [openSection, setOpenSection] = useState<OpenSection>("saved")
  const [selectedSavedId, setSelectedSavedId] = useState("")
  const [selectedOlderId, setSelectedOlderId] = useState("")
  const [selectedPurchaseFilter, setSelectedPurchaseFilter] = useState("")
  const [selectedDispensaryFilter, setSelectedDispensaryFilter] = useState("")
  const [deletingPurchaseId, setDeletingPurchaseId] = useState("")
  const [editingPurchase, setEditingPurchase] = useState<PurchaseLike | null>(null)
  const [editDispensary, setEditDispensary] = useState("")
  const [editPurchaseDate, setEditPurchaseDate] = useState("")
  const [editPurchaseTime, setEditPurchaseTime] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editItems, setEditItems] = useState<EditableDraftItem[]>([])
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const sortedPurchases = useMemo(() => {
    return [...purchases].sort(
      (a, b) => getPurchaseSortValue(b as PurchaseLike) - getPurchaseSortValue(a as PurchaseLike)
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

  const savedPurchases = useMemo(
    () => filteredPurchases.filter((purchase) => isPurchaseActive(purchase)),
    [filteredPurchases]
  )

  const olderPurchases = useMemo(
    () => filteredPurchases.filter((purchase) => !isPurchaseActive(purchase)),
    [filteredPurchases]
  )

  const selectedSavedPurchase =
    savedPurchases.find((purchase) => purchase.id === selectedSavedId) ?? null

  const selectedOlderPurchase =
    olderPurchases.find((purchase) => purchase.id === selectedOlderId) ?? null

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((current) => (current === section ? null : section))
  }

  function openEditPurchase(purchase: PurchaseLike) {
    setEditingPurchase(purchase)
    setEditDispensary(purchase.dispensary || "")
    setEditPurchaseDate(purchase.purchaseDate || "")
    setEditPurchaseTime(purchase.purchaseTime || "")
    setEditNotes(purchase.notes || "")
    setEditItems(
      purchase.items.length > 0
        ? createEditableItems(purchase)
        : [createEmptyEditableItem()]
    )
  }

  function closeEditPurchase() {
    if (isSavingEdit) return
    setEditingPurchase(null)
    setEditDispensary("")
    setEditPurchaseDate("")
    setEditPurchaseTime("")
    setEditNotes("")
    setEditItems([])
  }

  function updateEditItem(
    itemId: string,
    field: keyof Omit<EditableDraftItem, "id">,
    value: string
  ) {
    setEditItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  function addEditItem() {
    setEditItems((current) => [...current, createEmptyEditableItem()])
  }

  function removeEditItem(itemId: string) {
    setEditItems((current) => {
      if (current.length === 1) return current
      return current.filter((item) => item.id !== itemId)
    })
  }

  async function handleDeletePurchase(purchaseId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this purchase entry?"
    )

    if (!confirmed) return

    setDeletingPurchaseId(purchaseId)

    try {
      await deletePurchase(purchaseId)

      if (selectedSavedId === purchaseId) {
        setSelectedSavedId("")
      }

      if (selectedOlderId === purchaseId) {
        setSelectedOlderId("")
      }

      if (selectedPurchaseFilter === purchaseId) {
        setSelectedPurchaseFilter("")
      }
    } catch (error) {
      console.error("Failed to delete purchase:", error)
      alert("Unable to delete this purchase right now.")
    } finally {
      setDeletingPurchaseId("")
    }
  }

  async function handleSaveEditedPurchase() {
    if (!editingPurchase) return

    if (!editPurchaseDate) {
      alert("Please enter a purchase date.")
      return
    }

    if (!editPurchaseTime) {
      alert("Please enter a purchase time.")
      return
    }

    const hasInvalidItem = editItems.some(
      (item) =>
        !item.productName.trim() ||
        !item.category.trim() ||
        !item.grams.trim() ||
        Number(item.grams) <= 0
    )

    if (hasInvalidItem) {
      alert("Please complete product name, category, and grams for every item.")
      return
    }

    setIsSavingEdit(true)

    try {
      await updatePurchase({
        ...editingPurchase,
        dispensary: editDispensary.trim(),
        purchaseDate: editPurchaseDate,
        purchaseTime: editPurchaseTime,
        purchaseDateTime: `${editPurchaseDate}T${editPurchaseTime}`,
        notes: editNotes.trim(),
        items: editItems.map((item) => ({
          id: item.id,
          productName: item.productName.trim(),
          category: item.category.trim(),
          grams: Number(item.grams),
        })),
      })

      closeEditPurchase()
    } catch (error) {
      console.error("Failed to update purchase:", error)
      alert("Unable to save purchase changes right now.")
    } finally {
      setIsSavingEdit(false)
    }
  }

  return (
    <>
      <PageIntroPopup
        pageKey="purchase-history"
        title="Purchase History"
        description="Review your saved purchases and open any entry to see product details and grams used. Older purchases stay here for reference, even after they roll out of your active 30-day window."
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
              {savedPurchases.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
            <p className="text-[11px] uppercase tracking-wide text-slate-400">
              Tracking Window
            </p>
            <p className="mt-1 text-xl font-semibold text-emerald-400">30 Days</p>
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
                    <>
                      <PurchaseMetaCard purchase={selectedSavedPurchase} />

                      <PurchaseHistoryItem
                        key={selectedSavedPurchase.id}
                        purchaseDate={selectedSavedPurchase.purchaseDate}
                        purchaseTime={selectedSavedPurchase.purchaseTime}
                        dispensary={selectedSavedPurchase.dispensary}
                        source={selectedSavedPurchase.source}
                        items={selectedSavedPurchase.items}
                        isOpen
                        onToggle={() => setSelectedSavedId("")}
                        countsTowardAllotment={
                          selectedSavedPurchase.countsTowardAllotment
                        }
                        entryMode={selectedSavedPurchase.entryMode}
                        canEdit
                        canDelete
                        onEdit={() => openEditPurchase(selectedSavedPurchase)}
                        onDelete={() =>
                          handleDeletePurchase(selectedSavedPurchase.id)
                        }
                        isDeleting={deletingPurchaseId === selectedSavedPurchase.id}
                      />
                    </>
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
                    <>
                      <PurchaseMetaCard purchase={selectedOlderPurchase} />

                      <PurchaseHistoryItem
                        key={selectedOlderPurchase.id}
                        purchaseDate={selectedOlderPurchase.purchaseDate}
                        purchaseTime={selectedOlderPurchase.purchaseTime}
                        dispensary={selectedOlderPurchase.dispensary}
                        source={selectedOlderPurchase.source}
                        items={selectedOlderPurchase.items}
                        isOpen
                        onToggle={() => setSelectedOlderId("")}
                        countsTowardAllotment={
                          selectedOlderPurchase.countsTowardAllotment
                        }
                        entryMode={selectedOlderPurchase.entryMode}
                        canDelete
                        onDelete={() =>
                          handleDeletePurchase(selectedOlderPurchase.id)
                        }
                        isDeleting={deletingPurchaseId === selectedOlderPurchase.id}
                      />
                    </>
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
                    window after 30 days.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={closeEditPurchase}
              className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white"
              aria-label="Close edit purchase"
            >
              ✕
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Saved Purchase
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Edit Purchase
            </h2>

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Purchase Date
                </label>
                <input
                  type="date"
                  value={editPurchaseDate}
                  onChange={(e) => setEditPurchaseDate(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Purchase Time
                </label>
                <input
                  type="time"
                  value={editPurchaseTime}
                  onChange={(e) => setEditPurchaseTime(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Dispensary
                </label>
                <input
                  type="text"
                  value={editDispensary}
                  onChange={(e) => setEditDispensary(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="border-t border-white/10 pt-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">Items</p>
                  <button
                    type="button"
                    onClick={addEditItem}
                    className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/15"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="space-y-3">
                  {editItems.map((item, index) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-semibold text-white">
                          Item {index + 1}
                        </p>

                        {editItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeEditItem(item.id)}
                            className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/15"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Product name"
                          value={item.productName}
                          onChange={(e) =>
                            updateEditItem(item.id, "productName", e.target.value)
                          }
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        />

                        <div className="grid grid-cols-2 gap-3">
                          <select
                            value={item.category}
                            onChange={(e) =>
                              updateEditItem(item.id, "category", e.target.value)
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                          >
                            <option value="">Select category</option>
                            <option value="flower">Flower</option>
                            <option value="pre-roll">Pre-Roll</option>
                            <option value="edible">Edible</option>
                            <option value="vape">Vape</option>
                            <option value="concentrate">Concentrate</option>
                          </select>

                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Grams"
                            value={item.grams}
                            onChange={(e) =>
                              updateEditItem(item.id, "grams", e.target.value)
                            }
                            className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeEditPurchase}
                  disabled={isSavingEdit}
                  className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleSaveEditedPurchase}
                  disabled={isSavingEdit}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingEdit ? "Saving..." : "Save Purchase"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}