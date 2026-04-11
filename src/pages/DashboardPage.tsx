import { useEffect, useMemo, useState } from "react"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useSettingsStore } from "../features/settings/settingsStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"
import PageIntroPopup from "../components/PageIntroPopup"

type CalendarEvent = {
  type: "return" | "purchase"
  grams: number
}

type UpcomingReturnEvent = {
  id: string
  date: Date
  dateKey: string
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

function createLocalDateTime(dateString: string, timeString?: string) {
  return new Date(`${dateString}T${timeString || "12:00"}:00`)
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatReturnDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

function formatReturnTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  })
}

function eventSort(a: UpcomingReturnEvent, b: UpcomingReturnEvent) {
  return a.date.getTime() - b.date.getTime()
}

export default function DashboardPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )
  const settings = useSettingsStore((state) => state.settings)
  const allotment = useAllotmentStore((state) => state.allotment)

  const [activeBubble, setActiveBubble] = useState<{
    dateKey: string
    type: "return" | "purchase"
  } | null>(null)
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)
  const [isUpcomingReturnsOpen, setIsUpcomingReturnsOpen] = useState(false)
  const [visibleMonthOffset, setVisibleMonthOffset] = useState<-1 | 0 | 1>(0)

  useEffect(() => {
    loadPurchasesForCurrentUser()
  }, [loadPurchasesForCurrentUser])

  const allotmentLimit = settings.allotmentLimit

  const purchasesThatCount = useMemo(() => {
    return purchases.filter((purchase) => purchase.countsTowardAllotment)
  }, [purchases])

  const usedGramsFromPurchases = useMemo(() => {
    const now = new Date()

    return roundToTwo(
      purchasesThatCount.reduce((total, purchase) => {
        const purchaseDateTime = createLocalDateTime(
          purchase.purchaseDate,
          purchase.purchaseTime
        )

        const ageInMs = now.getTime() - purchaseDateTime.getTime()
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

  const purchaseCount = purchasesThatCount.length
  const avgPurchase =
    purchasesThatCount.length > 0
      ? roundToTwo(usedGramsFromPurchases / purchasesThatCount.length).toFixed(2)
      : "0.00"

  const today = new Date()
  const visibleDate = new Date(
    today.getFullYear(),
    today.getMonth() + visibleMonthOffset,
    1
  )
  const currentYear = visibleDate.getFullYear()
  const currentMonth = visibleDate.getMonth()
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

      const rollOffDate = createLocalDateTime(
        purchase.purchaseDate,
        purchase.purchaseTime
      )
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

  const upcomingReturns = useMemo<UpcomingReturnEvent[]>(() => {
    const now = new Date()

    return purchasesThatCount
      .map((purchase) => {
        const returnDate = createLocalDateTime(
          purchase.purchaseDate,
          purchase.purchaseTime
        )
        returnDate.setDate(returnDate.getDate() + 30)

        return {
          id: purchase.id,
          date: returnDate,
          dateKey: formatDateKey(returnDate),
          grams: getPurchaseTotalGrams(purchase.items || []),
        }
      })
      .filter((event) => event.date.getTime() > now.getTime())
      .sort((a, b) => eventSort(a, b))
      .slice(0, 3)
  }, [purchasesThatCount])

  const calendarCells = []

  for (let i = 0; i < firstDay; i++) {
    calendarCells.push(
      <div
        key={`empty-${i}`}
        className="min-h-[48px] rounded-lg border border-white/5 bg-slate-950/30 md:min-h-[72px]"
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
        className="relative min-h-[48px] rounded-lg border border-white/10 bg-slate-900/80 p-1.5 md:min-h-[72px] md:p-2"
      >
        <p className="text-[10px] font-semibold text-white md:text-xs">{day}</p>

        <div className="mt-1 flex flex-wrap gap-1 md:mt-2">
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
              className="flex h-4 w-4 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/15 text-[9px] font-bold text-emerald-400 md:h-5 md:w-5 md:text-[10px]"
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
              className="flex h-4 w-4 items-center justify-center rounded-full border border-red-500/30 bg-red-500/15 text-[9px] font-bold text-red-400 md:h-5 md:w-5 md:text-[10px]"
            >
              −
            </button>
          )}
        </div>

        {activeBubble?.dateKey === dateKey && (
          <div className="absolute left-1 right-1 top-6 z-20 rounded-lg border border-white/10 bg-slate-950 px-2 py-1 shadow-xl shadow-black/40 md:top-8">
            {activeBubble.type === "return" && returnEvents.length > 0 && (
              <p className="text-[9px] text-emerald-300 md:text-[10px]">
                +{returnTotal}g returning
              </p>
            )}

            {activeBubble.type === "purchase" && purchaseEvents.length > 0 && (
              <p className="text-[9px] text-red-300 md:text-[10px]">
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
        description="This page gives you a quick view of your current allotment, available grams, and recent activity. Use it as your home base to check your status and jump into Smart Planner or Add Visit."
      />

      <div className="mx-auto w-full max-w-[820px] space-y-4">
        <section className="overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-slate-900 p-3 shadow-lg shadow-emerald-950/20 md:p-5">
          <div className="grid grid-cols-2 gap-2 md:gap-4">
            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 md:px-4 md:py-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                Current Grams
              </p>
              <p className="mt-1 text-xl font-semibold text-white md:text-3xl">
                {remainingGrams}g
              </p>
              <p className="mt-1 text-[10px] text-slate-400 md:text-xs">
                Available right now
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-2.5 text-right md:px-4 md:py-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                Used Grams
              </p>
              <p className="mt-1 text-xl font-semibold text-white md:text-3xl">
                {usedGrams}g
              </p>
              <p className="mt-1 text-[10px] text-slate-400 md:text-xs">
                Active window
              </p>
            </div>
          </div>

          <div className="mt-3 md:mt-4">
            <div className="mb-1.5 flex items-center justify-between text-[10px] text-slate-400 md:text-xs">
              <span>30-day allotment usage</span>
              <span>{Math.round(percentUsed)}%</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-800/90 md:h-2.5">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all"
                style={{ width: `${percentUsed}%` }}
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 md:mt-4 md:gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 md:px-4 md:py-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                Total Visits
              </p>
              <p className="mt-1 text-base font-semibold text-white md:text-2xl">
                {purchaseCount}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 md:px-4 md:py-4">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                Avg. grams per visit
              </p>
              <p className="mt-1 text-base font-semibold text-white md:text-2xl">
                {avgPurchase}g
              </p>
            </div>
          </div>

          {hasCorrectedCurrentAllotment && (
            <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 md:mt-4 md:px-4 md:py-4">
              <p className="text-xs text-slate-300 md:text-sm">
                You are currently using a corrected current allotment value from
                your account settings.
              </p>
            </div>
          )}

          {!hasCorrectedCurrentAllotment &&
            allotment.setupMode === "manual" &&
            allotment.manualStartingAllotment !== null &&
            purchasesThatCount.length === 0 && (
              <div className="mt-3 rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3 md:mt-4 md:px-4 md:py-4">
                <p className="text-xs text-slate-300 md:text-sm">
                  You are currently using your manual starting allotment as your
                  baseline.
                </p>
              </div>
            )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-3 shadow-lg shadow-black/20 md:p-5">
          <button
            type="button"
            onClick={() => setIsCalendarOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left transition hover:border-emerald-500/30 md:px-5 md:py-4"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400 md:text-xs">
                Calendar View
              </p>
              <p className="mt-1 text-xs text-slate-400 md:text-sm">
                {getMonthName(visibleDate)}
              </p>
            </div>

            <span className="text-lg font-semibold text-emerald-400 md:text-2xl">
              {isCalendarOpen ? "−" : "+"}
            </span>
          </button>

          {isCalendarOpen && (
            <div className="mt-3 md:mt-4">
              <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-2 md:px-4 md:py-3">
                <button
                  type="button"
                  onClick={() => {
                    setVisibleMonthOffset((current) =>
                      current > -1 ? ((current - 1) as -1 | 0 | 1) : current
                    )
                    setActiveBubble(null)
                  }}
                  disabled={visibleMonthOffset === -1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-35 md:h-10 md:w-10 md:text-base"
                >
                  ←
                </button>

                <p className="text-sm font-semibold text-white md:text-lg">
                  {getMonthName(visibleDate)}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setVisibleMonthOffset((current) =>
                      current < 1 ? ((current + 1) as -1 | 0 | 1) : current
                    )
                    setActiveBubble(null)
                  }}
                  disabled={visibleMonthOffset === 1}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-900 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-35 md:h-10 md:w-10 md:text-base"
                >
                  →
                </button>
              </div>

              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 md:gap-2 md:text-xs">
                <span>Sun</span>
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
              </div>

              <div className="grid grid-cols-7 gap-1 md:gap-2">{calendarCells}</div>
            </div>
          )}
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-3 shadow-lg shadow-black/20 md:p-5">
          <button
            type="button"
            onClick={() => setIsUpcomingReturnsOpen((current) => !current)}
            className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left transition hover:border-emerald-500/30 md:px-5 md:py-4"
          >
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-400 md:text-xs">
                Returning Allotment
              </p>
              <p className="mt-1 text-xs text-slate-400 md:text-sm">
                Next 3 allotment returns
              </p>
            </div>

            <span className="text-lg font-semibold text-emerald-400 md:text-2xl">
              {isUpcomingReturnsOpen ? "−" : "+"}
            </span>
          </button>

          {isUpcomingReturnsOpen && (
            <div className="mt-3 md:mt-4">
              {upcomingReturns.length > 0 ? (
                <div className="space-y-2 md:space-y-3">
                  {upcomingReturns.map((event) => (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 md:px-4 md:py-4"
                    >
                      <div className="grid grid-cols-3 gap-2 text-sm md:gap-4 md:text-base">
                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                            Date
                          </p>
                          <p className="mt-1 font-medium text-white">
                            {formatReturnDate(event.date)}
                          </p>
                        </div>

                        <div>
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                            Time
                          </p>
                          <p className="mt-1 font-medium text-white">
                            {formatReturnTime(event.date)}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-wide text-slate-400 md:text-xs">
                            Returning
                          </p>
                          <p className="mt-1 font-semibold text-emerald-400">
                            +{event.grams}g
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/70 px-3 py-3 md:px-4 md:py-4">
                  <p className="text-sm text-slate-400 md:text-base">
                    No upcoming allotment returns found.
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
    </>
  )
}