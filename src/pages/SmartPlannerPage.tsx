import { useEffect, useMemo, useState } from "react"
import SectionCard from "../components/SectionCard"
import PageIntroPopup from "../components/PageIntroPopup"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

type BuilderItem = {
  id: string
  category: string
  grams: string
}

type OpenSection = "status" | "usage" | "insights" | "builder" | null

const STATE_ALLOTMENT_LIMIT = 84.03

function createEmptyBuilderItem(): BuilderItem {
  return {
    id: crypto.randomUUID(),
    category: "",
    grams: "",
  }
}

function getBuilderItemSummary(item: BuilderItem) {
  const parts = []

  if (item.category.trim()) parts.push(item.category.trim())
  if (item.grams.trim()) parts.push(`${item.grams}g`)

  return parts.length > 0 ? parts.join(" • ") : "Tap to add details"
}

function formatMonthLabel(date: Date) {
  if (Number.isNaN(date.getTime())) return "Unknown"
  return date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  })
}

function daysBetween(start: Date, end: Date) {
  const ms = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
}

function getPurchaseDateTime(
  purchase: {
    purchaseDateTime?: string
    purchaseDate?: string
    purchaseTime?: string
  }
) {
  const rawDateTime = String(purchase.purchaseDateTime ?? "").trim()

  if (rawDateTime) {
    const parsed = new Date(rawDateTime)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const rawDate = String(purchase.purchaseDate ?? "").trim()
  const rawTime = String(purchase.purchaseTime ?? "").trim() || "12:00"

  if (!rawDate) return null

  const fallback = new Date(`${rawDate}T${rawTime}`)
  return Number.isNaN(fallback.getTime()) ? null : fallback
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

export default function SmartPlannerPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const isLoadingPurchases = usePurchaseStore((state) => state.isLoading)
  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )
  const allotment = useAllotmentStore((state) => state.allotment)

  const [builderItems, setBuilderItems] = useState<BuilderItem[]>([
    createEmptyBuilderItem(),
  ])
  const [expandedBuilderItemId, setExpandedBuilderItemId] = useState<
    string | null
  >(null)
  const [openSection, setOpenSection] = useState<OpenSection>("status")

  useEffect(() => {
    loadPurchasesForCurrentUser()
  }, [loadPurchasesForCurrentUser])

  const analytics = useMemo(() => {
    const now = new Date()
    const safePurchases = Array.isArray(purchases) ? purchases : []
    const purchasesThatCount = safePurchases.filter(
      (purchase) => purchase.countsTowardAllotment
    )

    const activeEntries = purchasesThatCount
      .map((purchase) => {
        const purchaseDateTime = getPurchaseDateTime(purchase)
        const items = Array.isArray(purchase.items) ? purchase.items : []

        const grams = items.reduce(
          (sum, item) => sum + Number(item.grams || 0),
          0
        )

        if (!purchaseDateTime) return null
        if (purchaseDateTime > now) return null

        const rollOffDateTime = new Date(
          purchaseDateTime.getTime() + 30 * 24 * 60 * 60 * 1000
        )

        const diffMs = rollOffDateTime.getTime() - now.getTime()
        const daysUntilRollOff = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

        return {
          grams,
          daysUntilRollOff,
        }
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
      .filter((entry) => entry.daysUntilRollOff > 0)

    const activeGramsFromPurchases = activeEntries.reduce(
      (sum, entry) => sum + Number(entry.grams || 0),
      0
    )

    const hasCorrectedCurrentAllotment =
      allotment.correctedCurrentAllotment !== null

    const isUsingManualPlannerValues =
      !hasCorrectedCurrentAllotment &&
      allotment.setupMode === "manual" &&
      allotment.manualStartingAllotment !== null &&
      purchasesThatCount.length === 0

    const activeGrams = hasCorrectedCurrentAllotment
      ? Math.max(0, STATE_ALLOTMENT_LIMIT - allotment.correctedCurrentAllotment!)
      : isUsingManualPlannerValues
        ? Math.max(0, STATE_ALLOTMENT_LIMIT - allotment.manualStartingAllotment!)
        : activeGramsFromPurchases

    const remainingGrams = hasCorrectedCurrentAllotment
      ? Math.max(0, allotment.correctedCurrentAllotment!)
      : isUsingManualPlannerValues
        ? Math.max(0, allotment.manualStartingAllotment!)
        : Math.max(0, STATE_ALLOTMENT_LIMIT - activeGramsFromPurchases)

    const monthlyMap = new Map<string, { label: string; grams: number }>()

    for (const purchase of purchasesThatCount) {
      const purchaseDateTime = getPurchaseDateTime(purchase)
      if (!purchaseDateTime) continue

      const key = `${purchaseDateTime.getFullYear()}-${purchaseDateTime.getMonth()}`
      const label = formatMonthLabel(purchaseDateTime)

      const items = Array.isArray(purchase.items) ? purchase.items : []

      const gramsFromItems = items.reduce(
        (sum, item) => sum + Number(item.grams || 0),
        0
      )

      const existing = monthlyMap.get(key) || { label, grams: 0 }
      existing.grams += gramsFromItems
      monthlyMap.set(key, existing)
    }

    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([, value]) => value)

    const currentMonth =
      monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : null

    const priorMonths = monthlyData.slice(0, -1)

    const averageMonthlyGrams =
      priorMonths.length > 0
        ? priorMonths.reduce((sum, month) => sum + month.grams, 0) /
          priorMonths.length
        : currentMonth?.grams || 0

    const cycleStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const cyclePurchases = purchasesThatCount.filter((purchase) => {
      const purchaseDateTime = getPurchaseDateTime(purchase)
      if (!purchaseDateTime) return false
      return purchaseDateTime >= cycleStart && purchaseDateTime <= now
    })

    const gramsUsedInCycle = cyclePurchases.reduce((sum, purchase) => {
      const items = Array.isArray(purchase.items) ? purchase.items : []
      const itemsTotal = items.reduce(
        (itemSum, item) => itemSum + Number(item.grams || 0),
        0
      )
      return sum + itemsTotal
    }, 0)

    const daysElapsed = daysBetween(cycleStart, now)
    const dailyBurnRate = gramsUsedInCycle / daysElapsed
    const daysUntilRefill = 30 - Math.min(30, daysElapsed)
    const projectedNeedBeforeRefill = dailyBurnRate * daysUntilRefill
    const projectedShortfall = projectedNeedBeforeRefill - remainingGrams

    let statusLabel = "On track"
    let statusTone = "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"

    if (remainingGrams <= 0 || projectedShortfall > 0) {
      statusLabel = "Risk of running out early"
      statusTone = "border-rose-500/20 bg-rose-500/10 text-rose-300"
    } else if (
      currentMonth &&
      averageMonthlyGrams > 0 &&
      currentMonth.grams > averageMonthlyGrams * 1.15
    ) {
      statusLabel = "Usage higher than usual"
      statusTone = "border-amber-500/20 bg-amber-500/10 text-amber-300"
    }

    const usageDifferencePct =
      averageMonthlyGrams > 0 && currentMonth
        ? ((currentMonth.grams - averageMonthlyGrams) / averageMonthlyGrams) *
          100
        : 0

    return {
      purchaseCount: purchasesThatCount.length,
      activeGrams,
      remainingGrams,
      monthlyData,
      averageMonthlyGrams,
      currentMonth,
      daysUntilRefill,
      dailyBurnRate,
      projectedNeedBeforeRefill,
      projectedShortfall,
      statusLabel,
      statusTone,
      usageDifferencePct,
      isUsingManualAllotment: isUsingManualPlannerValues,
      hasCorrectedCurrentAllotment,
    }
  }, [purchases, allotment])

  const maxGrams = Math.max(
    ...analytics.monthlyData.map((month) => month.grams),
    1
  )

  const builderTotal = builderItems.reduce(
    (sum, item) => sum + Number(item.grams || 0),
    0
  )
  const projectedAfterBuilder = analytics.remainingGrams - builderTotal

  function updateBuilderItem(
    itemId: string,
    field: keyof Omit<BuilderItem, "id">,
    value: string
  ) {
    setBuilderItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  function addAnotherBuilderItem() {
    const newItem = createEmptyBuilderItem()
    setBuilderItems((currentItems) => [...currentItems, newItem])
    setExpandedBuilderItemId(newItem.id)
  }

  function removeBuilderItem(itemId: string) {
    setBuilderItems((currentItems) => {
      if (currentItems.length === 1) return currentItems

      const filtered = currentItems.filter((item) => item.id !== itemId)

      if (expandedBuilderItemId === itemId) {
        setExpandedBuilderItemId(filtered[filtered.length - 1]?.id ?? null)
      }

      return filtered
    })
  }

  function toggleBuilderExpanded(itemId: string) {
    setExpandedBuilderItemId((current) => (current === itemId ? null : itemId))
  }

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  return (
    <>
      <PageIntroPopup
        pageKey="smart-planner"
        title="Smart Purchase Planner"
        description="This page helps you see your current allotment, usage trends, and projected risk before your next refill. Use Allotment Builder to preview how entries may affect your remaining allotment."
      />

      <div className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">
            Smart Planner
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            See your current allotment, usage pattern, projected risk, and review
            your remaining allotment before your next visit.
          </p>
        </div>

        {isLoadingPurchases && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3 text-sm text-slate-300">
            Refreshing planner data...
          </div>
        )}

        <div className="space-y-3">
          <CollapseHeader
            title={`Current Allotment Status${analytics.purchaseCount ? ` • ${analytics.purchaseCount} visits` : ""}`}
            isOpen={openSection === "status"}
            onClick={() => toggleSection("status")}
          />

          {openSection === "status" && (
            <div
              className={`rounded-2xl border px-3 py-3 shadow-sm shadow-black/20 ${analytics.statusTone}`}
            >
              <div className="flex items-start gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-200/80">
                    Current Allotment Status
                  </p>
                  <h2 className="mt-1 text-sm font-semibold text-white">
                    {analytics.statusLabel}
                  </h2>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Current Grams
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {analytics.remainingGrams.toFixed(2)}g
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Allotment Limit
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {STATE_ALLOTMENT_LIMIT.toFixed(2)}g
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Days Until Refill
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {analytics.daysUntilRefill}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2.5">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Historical Pace
                  </p>
                  <p className="mt-1 text-lg font-semibold text-white">
                    {analytics.dailyBurnRate.toFixed(2)}g
                  </p>
                </div>
              </div>

              {analytics.hasCorrectedCurrentAllotment && (
                <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-xs text-slate-300">
                    You are currently using a corrected current allotment value
                    from your account settings.
                  </p>
                </div>
              )}

              {!analytics.hasCorrectedCurrentAllotment &&
                analytics.isUsingManualAllotment && (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                    <p className="text-xs text-slate-300">
                      You are currently using a manually entered starting allotment.
                      Historical visits that do not count toward allotment can still
                      be saved in visit history without lowering this balance.
                    </p>
                  </div>
                )}
            </div>
          )}

          <CollapseHeader
            title="Monthly Usage Habit"
            isOpen={openSection === "usage"}
            onClick={() => toggleSection("usage")}
          />

          {openSection === "usage" && (
            <SectionCard title="">
              {analytics.monthlyData.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-slate-300">
                    Your recent monthly grams pattern based on visits that count
                    toward your allotment.
                  </p>

                  <div className="space-y-3">
                    {analytics.monthlyData.map((month) => (
                      <div key={month.label} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-medium text-white">
                            {month.label}
                          </span>
                          <span className="text-slate-400">
                            {month.grams.toFixed(1)}g
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${Math.max(
                                6,
                                (month.grams / maxGrams) * 100
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Avg. Monthly Grams
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {analytics.averageMonthlyGrams.toFixed(1)}g
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
                  Add more allotment-counting visit history to unlock usage insights.
                </div>
              )}
            </SectionCard>
          )}

          <CollapseHeader
            title="Planner Insights"
            isOpen={openSection === "insights"}
            onClick={() => toggleSection("insights")}
          />

          {openSection === "insights" && (
            <SectionCard title="">
              <div className="space-y-2.5">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    You currently have{" "}
                    <span className="font-semibold text-white">
                      {analytics.remainingGrams.toFixed(2)}g
                    </span>{" "}
                    remaining in your active 30-day window.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    Based on your visit history, your pace is{" "}
                    <span className="font-semibold text-white">
                      {analytics.dailyBurnRate.toFixed(2)}g/day
                    </span>
                    , and you are projected to need about{" "}
                    <span className="font-semibold text-white">
                      {analytics.projectedNeedBeforeRefill.toFixed(1)}g
                    </span>{" "}
                    before your balance starts rolling back.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-sm text-slate-200">
                    {analytics.projectedShortfall > 0 ? (
                      <>
                        Warning: at your recorded pace, you may run short by about{" "}
                        <span className="font-semibold text-rose-300">
                          {analytics.projectedShortfall.toFixed(1)}g
                        </span>{" "}
                        before allotment returns.
                      </>
                    ) : analytics.currentMonth &&
                      analytics.averageMonthlyGrams > 0 &&
                      analytics.usageDifferencePct > 15 ? (
                      <>
                        This month is running about{" "}
                        <span className="font-semibold text-amber-300">
                          {analytics.usageDifferencePct.toFixed(0)}% above
                        </span>{" "}
                        your recent monthly average.
                      </>
                    ) : (
                      <>Your current usage pattern looks stable compared with recent history.</>
                    )}
                  </p>
                </div>
              </div>
            </SectionCard>
          )}

          <CollapseHeader
            title="Allotment Builder"
            isOpen={openSection === "builder"}
            onClick={() => toggleSection("builder")}
          />

          {openSection === "builder" && (
            <SectionCard title="">
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                  <p className="text-xs leading-4 text-slate-200">
                    Preview how entries may affect your remaining allotment.
                  </p>
                </div>

                <div className="space-y-3">
                  {builderItems.map((item, index) => {
                    const isExpanded = expandedBuilderItemId === item.id

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/80"
                      >
                        <button
                          type="button"
                          onClick={() => toggleBuilderExpanded(item.id)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              Planned Item {index + 1}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {getBuilderItemSummary(item)}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
                            {isExpanded ? "−" : "+"}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10 px-3 pb-3 pt-3">
                            <div className="mb-3 flex items-center justify-end">
                              {builderItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeBuilderItem(item.id)}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Category
                                  </label>
                                  <select
                                    value={item.category}
                                    onChange={(e) =>
                                      updateBuilderItem(
                                        item.id,
                                        "category",
                                        e.target.value
                                      )
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
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Grams
                                  </label>
                                  <input
                                    placeholder="0.0"
                                    type="number"
                                    step="0.01"
                                    value={item.grams}
                                    onChange={(e) =>
                                      updateBuilderItem(
                                        item.id,
                                        "grams",
                                        e.target.value
                                      )
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addAnotherBuilderItem}
                    className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/15"
                  >
                    + Add Item
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Planned Total
                    </p>
                    <p className="mt-1 text-base font-semibold text-white">
                      {builderTotal.toFixed(2)}g
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      After Visit
                    </p>
                    <p
                      className={`mt-1 text-base font-semibold ${
                        projectedAfterBuilder >= 0
                          ? "text-emerald-400"
                          : "text-rose-300"
                      }`}
                    >
                      {projectedAfterBuilder.toFixed(2)}g
                    </p>
                  </div>
                </div>

                <div
                  className={`rounded-2xl border px-3 py-3 text-sm ${
                    projectedAfterBuilder < 0
                      ? "border-rose-500/20 bg-rose-500/10 text-rose-200"
                      : projectedAfterBuilder <= analytics.remainingGrams * 0.2
                        ? "border-amber-500/20 bg-amber-500/10 text-amber-200"
                        : "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                  }`}
                >
                  {projectedAfterBuilder < 0
                    ? "This amount would push you over your current available allotment."
                    : projectedAfterBuilder <= analytics.remainingGrams * 0.2
                      ? "This amount fits, but it would leave you with very little remaining allotment."
                      : "This amount is within your current remaining allotment."}
                </div>
              </div>
            </SectionCard>
          )}
        </div>
      </div>
    </>
  )
}