import { useMemo, useState } from "react"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useSettingsStore } from "../features/settings/settingsStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"
import PageIntroPopup from "../components/PageIntroPopup"

type CalendarEvent = {
  type: "return" | "purchase"
  grams: number
}

function roundToTwo(num: number) {
  return Math.round(num * 100) / 100
}

function getPurchaseTotalGrams(items: { grams: number }[]) {
  return roundToTwo(items.reduce((total, item) => total + item.grams, 0))
}

function getMonthName(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

function formatDateKey(date: Date) {
  return date.toISOString().split("T")[0]
}

function createLocalDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export default function DashboardPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const settings = useSettingsStore((state) => state.settings)
  const allotment = useAllotmentStore((state) => state.allotment)

  const allotmentLimit = settings.allotmentLimit

  const purchasesThatCount = useMemo(() => {
    return purchases.filter((purchase) => purchase.countsTowardAllotment)
  }, [purchases])

  const usedGramsFromPurchases = useMemo(() => {
    const today = new Date()

    return roundToTwo(
      purchasesThatCount.reduce((total, purchase) => {
        const purchaseDate = createLocalDate(purchase.purchaseDate)
        const ageInMs = today.getTime() - purchaseDate.getTime()
        const ageInDays = Math.floor(ageInMs / (1000 * 60 * 60 * 24))

        if (ageInDays >= 0 && ageInDays < 30) {
          return total + getPurchaseTotalGrams(purchase.items || [])
        }

        return total
      }, 0)
    )
  }, [purchasesThatCount])

  const hasCorrectedCurrentAllotment =
    allotment.correctedCurrentAllotment !== null

  const isUsingManualDashboardValues =
    !hasCorrectedCurrentAllotment &&
    allotment.setupMode === "manual" &&
    allotment.manualStartingAllotment !== null &&
    purchasesThatCount.length === 0

  const usedGrams = hasCorrectedCurrentAllotment
    ? roundToTwo(
        Math.max(allotmentLimit - allotment.correctedCurrentAllotment!, 0)
      )
    : isUsingManualDashboardValues
      ? roundToTwo(
          Math.max(allotmentLimit - allotment.manualStartingAllotment!, 0)
        )
      : usedGramsFromPurchases

  const remainingGrams = hasCorrectedCurrentAllotment
    ? roundToTwo(allotment.correctedCurrentAllotment!)
    : isUsingManualDashboardValues
      ? roundToTwo(allotment.manualStartingAllotment!)
      : roundToTwo(Math.max(allotmentLimit - usedGramsFromPurchases, 0))

  const percentUsed =
    allotmentLimit > 0 ? Math.min((usedGrams / allotmentLimit) * 100, 100) : 0

  const purchaseCount = purchases.length
  const avgPurchase =
    purchasesThatCount.length > 0
      ? roundToTwo(usedGramsFromPurchases / purchasesThatCount.length).toFixed(2)
      : "0.00"

  const today = new Date()
  const currentYear = today.getFullYear()
  const currentMonth = today.getMonth()
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)

  const calendarEvents = useMemo(() => {
    const eventMap: Record<string, CalendarEvent[]> = {}

    purchasesThatCount.forEach((purchase) => {
      const totalGrams = getPurchaseTotalGrams(purchase.items || [])
      const purchaseDate = createLocalDate(purchase.purchaseDate)
      const purchaseKey = formatDateKey(purchaseDate)

      if (!eventMap[purchaseKey]) eventMap[purchaseKey] = []
      eventMap[purchaseKey].push({
        type: "purchase",
        grams: totalGrams,
      })

      const rollOffDate = new Date(purchaseDate)
      rollOffDate.setDate(rollOffDate.getDate() + 30)
      const rollOffKey = formatDateKey(rollOffDate)

      if (!eventMap[rollOffKey]) eventMap[rollOffKey] = []
      eventMap[rollOffKey].push({
        type: "return",
        grams: totalGrams,
      })
    })

    return eventMap
  }, [purchasesThatCount])

  const [activeBubble, setActiveBubble] = useState<{
    dateKey: string
    type: "return" | "purchase"
  } | null>(null)

  const calendarCells = []

  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="min-h-[48px] rounded-lg border border-white/5 bg-slate-950/30"
      />
    )
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cellDate = new Date(currentYear, currentMonth, day)
    const dateKey = formatDateKey(cellDate)
    const events = calendarEvents[dateKey] || []

    const purchaseEvents = events.filter((event) => event.type === "purchase")
    const returnEvents = events.filter((event) => event.type === "return")

    const purchaseTotal = roundToTwo(
      purchaseEvents.reduce((sum, event) => sum + event.grams, 0)
    )
    const returnTotal = roundToTwo(
      returnEvents.reduce((sum, event) => sum + event.grams, 0)
    )

    calendarCells.push(
      <div
        key={dateKey}
        className="relative min-h-[48px] rounded-lg border border-white/10 bg-slate-900/80 p-1.5"
      >
        <p className="text-[10px] font-semibold text-white">{day}</p>

        <div className="mt-1 flex flex-wrap gap-1">
          {returnEvents.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setActiveBubble((current) =>
                  current?.dateKey === dateKey && current.type === "return"
                    ? null
                    : { dateKey, type: "return" }
                )
              }
              className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-[9px] font-bold text-emerald-400"
            >
              +
            </button>
          )}

          {purchaseEvents.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setActiveBubble((current) =>
                  current?.dateKey === dateKey && current.type === "purchase"
                    ? null
                    : { dateKey, type: "purchase" }
                )
              }
              className="flex h-4 w-4 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 text-[9px] font-bold text-red-400"
            >
              −
            </button>
          )}
        </div>

        {activeBubble?.dateKey === dateKey && (
          <div className="absolute left-1 right-1 top-6 z-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 shadow-xl shadow-black/40">
            {activeBubble.type === "return" && returnEvents.length > 0 && (
              <p className="text-[9px] text-emerald-300">
                +{returnTotal}g returning
              </p>
            )}

            {activeBubble.type === "purchase" && purchaseEvents.length > 0 && (
              <p className="text-[9px] text-red-300">
                -{purchaseTotal}g used
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <PageIntroPopup
        pageKey="dashboard"
        title="Welcome to your Dashboard"
        description="This page gives you a quick view of your current allotment, available grams, and recent activity. Use it as your home base to check your status and jump into Smart Planner or Add Purchase."
      />

      <div className="space-y-3">
        <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-900 p-3 shadow-lg shadow-emerald-950/20">
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Current Grams
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {remainingGrams}g
              </p>
              <p className="mt-1 text-[10px] text-slate-400">
                Available right now
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-right">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Used Grams
              </p>
              <p className="mt-1 text-xl font-semibold text-white">
                {usedGrams}g
              </p>
              <p className="mt-1 text-[10px] text-slate-400">Active window</p>
            </div>
          </div>

          <div className="mt-3">
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400">
              <span>30-day allotment usage</span>
              <span>{Math.round(percentUsed)}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800/90">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Total Purchases
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {purchaseCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">
                Avg Purchase
              </p>
              <p className="mt-1 text-base font-semibold text-white">
                {avgPurchase}g
              </p>
            </div>
          </div>

          {hasCorrectedCurrentAllotment && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
              <p className="text-xs text-slate-300">
                You are currently using a corrected current allotment value from
                your account settings.
              </p>
            </div>
          )}

          {!hasCorrectedCurrentAllotment &&
            allotment.setupMode === "manual" &&
            allotment.manualStartingAllotment !== null &&
            purchasesThatCount.length === 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
                <p className="text-xs text-slate-300">
                  You are currently using your manual starting allotment as your
                  baseline.
                </p>
              </div>
            )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-3 shadow-lg shadow-black/20">
          <div className="mb-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400">
              Calendar View
            </p>
            <h3 className="mt-1 text-base font-semibold text-white">
              {getMonthName(today)}
            </h3>
          </div>

          <div className="grid grid-cols-7 gap-1">{calendarCells}</div>
        </section>
      </div>
    </>
  )
}