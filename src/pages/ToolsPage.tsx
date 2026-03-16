import PlannerResultCard from "../components/PlannerResultCard"
import SectionCard from "../components/SectionCard"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { getPlannerData } from "../utils/allotment"

export default function ToolsPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const plannerData = getPlannerData(purchases)

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
          BudBalance
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">
          Smart Purchase Planner
        </h1>
        <p className="mt-1 text-xs text-slate-400">
          Estimate what you can buy now and what is returning soon.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <PlannerResultCard
          title="Safe to Buy Right Now"
          value={`${plannerData.safeToBuyNow}g`}
          detail="Based on your current active 31-day window, this is the amount available right now."
        />

        <PlannerResultCard
          title="Next Major Return"
          value={plannerData.nextReturnDate}
          detail="Your next batch of grams is projected to return on this date."
        />

        <PlannerResultCard
          title="Next Return Amount"
          value={`+${plannerData.nextReturnAmount}g`}
          detail="This is the next amount expected to roll off and return to your balance."
        />
      </div>

      <SectionCard title="Planner Forecast">
        {plannerData.upcomingRollOffs.length > 0 ? (
          <div className="grid gap-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
              <p className="text-sm text-slate-200">
                You can safely purchase up to {plannerData.safeToBuyNow}g right now.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
              <p className="text-sm text-slate-200">
                Your next return of +{plannerData.nextReturnAmount}g is expected on{" "}
                {plannerData.nextReturnDate}.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-3 py-3">
              <p className="text-sm text-slate-200">
                Across your next two returns, approximately +{plannerData.projectedGainSoon}g
                should return to your balance.
              </p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 text-sm text-slate-400">
            No planner forecast is available because there are no active purchases in the current window.
          </div>
        )}
      </SectionCard>

      <SectionCard title="Upcoming Return Schedule">
        {plannerData.upcomingRollOffs.length > 0 ? (
          <div className="space-y-2">
            {plannerData.upcomingRollOffs.slice(0, 5).map((item) => (
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
            No upcoming returns found.
          </div>
        )}
      </SectionCard>
    </div>
  )
}