type PurchaseHistoryItemProps = {
  productName: string
  grams: number
  purchaseDate: string
  dispensary: string
  source: string
}

export default function PurchaseHistoryItem(props: PurchaseHistoryItemProps) {
  const { productName, grams, purchaseDate, dispensary, source } = props

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-white">{productName}</h3>
          <p className="mt-1 text-sm text-slate-400">{dispensary}</p>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-emerald-400">{grams}g</p>
          <p className="text-xs text-slate-400">{source}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-700 pt-3">
        <p className="text-sm text-slate-300">Purchased: {purchaseDate}</p>
      </div>
    </div>
  )
}