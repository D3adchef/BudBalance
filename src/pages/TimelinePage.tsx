import SectionCard from "../components/SectionCard"
import TimelineItem from "../components/TimelineItem"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { getTimelineEntries, getUpcomingRollOffs } from "../utils/allotment"

export default function TimelinePage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  const timelineEntries = getTimelineEntries(purchases)
  const upcomingReturns = getUpcomingRollOffs(purchases).slice(0, 5)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-400">BudBalance</p>
        <h1 className="mt-1 text-2xl font-bold">Allotment Timeline</h1>
      </div>

      <SectionCard title="31-Day Window Summary">
        <div className="space-y-2 text-sm text-slate-300">
          <p>Tracking grams purchased inside the active 31-day window.</p>
          <p>
            As purchases reach day 31, their grams return to your available
            balance.
          </p>
          <p>
            This page shows what is active now and what is about to roll off.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Timeline Entries">
        <div className="space-y-4">
          {timelineEntries.length > 0 ? (
            timelineEntries.map((entry) => (
              <TimelineItem
                key={entry.id}
                purchaseDate={entry.purchaseDate}
                productName={entry.productName}
                grams={entry.grams}
                rollOffDate={entry.rollOffDate}
                daysUntilRollOff={entry.daysUntilRollOff}
                status={entry.status}
              />
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No purchases are currently inside the active 31-day window.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming Returns">
        <div className="space-y-3">
          {upcomingReturns.length > 0 ? (
            upcomingReturns.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between border-b border-slate-700 pb-2 last:border-b-0"
              >
                <div>
                  <p className="text-slate-300">{item.productName}</p>
                  <p className="text-xs text-slate-500">{item.rollOffDate}</p>
                </div>
                <span className="font-semibold text-emerald-400">
                  +{item.grams}g
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400">
              No upcoming returns in the active window.
            </p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}