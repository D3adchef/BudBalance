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
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            {productName}
          </h3>
          <p className="mt-1 truncate text-xs text-slate-400">
            {dispensary || "Dispensary not entered"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-emerald-400">{grams}g</p>
          <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
            {source}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          Purchase Date
        </p>
        <p className="text-xs font-medium text-slate-300">{purchaseDate}</p>
      </div>
    </div>
  )
}