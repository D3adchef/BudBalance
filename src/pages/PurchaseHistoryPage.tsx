import PurchaseHistoryItem from "../components/PurchaseHistoryItem"
import SectionCard from "../components/SectionCard"
import { usePurchaseStore } from "../features/purchases/purchaseStore"

export default function PurchaseHistoryPage() {
  const purchases = usePurchaseStore((state) => state.purchases)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm text-slate-400">BudBalance</p>
        <h1 className="mt-1 text-2xl font-bold">Purchase History</h1>
      </div>

      <SectionCard title="Saved Purchases">
        <div className="space-y-4">
          {purchases.map((purchase) => (
            <PurchaseHistoryItem
              key={purchase.id}
              productName={purchase.productName}
              grams={purchase.grams}
              purchaseDate={purchase.purchaseDate}
              dispensary={purchase.dispensary}
              source={purchase.source}
            />
          ))}
        </div>
      </SectionCard>

      <SectionCard title="History Rules">
        <div className="space-y-2 text-sm text-slate-300">
          <p>Full product details are stored for reference and history.</p>
          <p>Only grams affect allotment calculations.</p>
          <p>Purchases roll out of the active window after 31 days.</p>
        </div>
      </SectionCard>
    </div>
  )
}