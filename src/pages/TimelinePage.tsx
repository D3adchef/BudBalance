import SectionCard from "../components/SectionCard"
import TimelineItem from "../components/TimelineItem"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { getTimelineEntries, getUpcomingRollOffs } from "../utils/allotment"

export default function TimelinePage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  const timelineEntries = getTimelineEntries(purchases)
  const upcomingReturns = getUpcomingRollOffs(purchases).slice(0, 5)

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
          BudBalance
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">
          Allotment Timeline
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          View active purchases and what is about to return to your balance.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Active Entries
          </p>
          <p className="mt-1 text-xl font-semibold text-white">
            {timelineEntries.length}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/90 px-3 py-3 shadow-sm shadow-black/20">
          <p className="text-[11px] uppercase tracking-wide text-slate-400">
            Upcoming Returns
          </p>
          <p className="mt-1 text-xl font-semibold text-emerald-400">
            {upcomingReturns.length}
          </p>
        </div>
      </div>

      <SectionCard title="31-Day Window Summary">
        <div className="grid gap-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              Tracking grams purchased inside the active 31-day window.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              As purchases reach day 31, their grams return to your available
              balance.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
            <p className="text-sm text-slate-200">
              This page shows what is active now and what is about to roll off.
            </p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Timeline Entries">
        {timelineEntries.length > 0 ? (
          <div className="space-y-2.5">
            {timelineEntries.map((entry) => (
              <TimelineItem
                key={entry.id}
                purchaseDate={entry.purchaseDate}
                productName={entry.productName}
                grams={entry.grams}
                rollOffDate={entry.rollOffDate}
                daysUntilRollOff={entry.daysUntilRollOff}
                status={entry.status}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
            No purchases are currently inside the active 31-day window.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Upcoming Returns">
        {upcomingReturns.length > 0 ? (
          <div className="space-y-2">
            {upcomingReturns.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3"
              >
                <div className="min-w-0 pr-3">
                  <p className="truncate text-sm font-medium text-white">
                    {item.productName}
                  </p>
                  <p className="text-[11px] text-slate-400">{item.rollOffDate}</p>
                </div>

                <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                  +{item.grams}g
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
            No upcoming returns in the active window.
          </div>
        )}
      </SectionCard>
    </div>
  )
}