import PlannerResultCard from "../components/PlannerResultCard"
import SectionCard from "../components/SectionCard"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { getPlannerData } from "../utils/allotment"

export default function ToolsPage() {
  const purchases = usePurchaseStore((state) => state.purchases)
  const plannerData = getPlannerData(purchases)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-400">BudBalance</p>
        <h1 className="mt-1 text-2xl font-bold">Smart Purchase Planner</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
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
        <div className="space-y-3 text-sm text-slate-300">
          {plannerData.upcomingRollOffs.length > 0 ? (
            <>
              <p>
                You can safely purchase up to {plannerData.safeToBuyNow}g right now.
              </p>
              <p>
                Your next return of +{plannerData.nextReturnAmount}g is expected on{" "}
                {plannerData.nextReturnDate}.
              </p>
              <p>
                Across your next two returns, approximately +{plannerData.projectedGainSoon}g
                should return to your balance.
              </p>
            </>
          ) : (
            <p>No planner forecast is available because there are no active purchases in the current window.</p>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Upcoming Return Schedule">
        <div className="space-y-3">
          {plannerData.upcomingRollOffs.length > 0 ? (
            plannerData.upcomingRollOffs.slice(0, 5).map((item) => (
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
            <p className="text-sm text-slate-400">No upcoming returns found.</p>
          )}
        </div>
      </SectionCard>
    </div>
  )
}