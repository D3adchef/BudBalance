type PurchaseLineItem = {
  id: string
  productName: string
  category: string
  grams: number
}

type PurchaseHistoryItemProps = {
  purchaseDate: string
  dispensary: string
  source: string
  items: PurchaseLineItem[]
  isOpen: boolean
  onToggle: () => void
}

function getCategoryStyles(category: string) {
  switch (category) {
    case "flower":
      return "bg-green-500/15 text-green-400 border-green-500/30"
    case "pre-roll":
      return "bg-yellow-500/15 text-yellow-400 border-yellow-500/30"
    case "edible":
      return "bg-purple-500/15 text-purple-400 border-purple-500/30"
    case "vape":
      return "bg-blue-500/15 text-blue-400 border-blue-500/30"
    case "concentrate":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30"
    default:
      return "bg-slate-700 text-slate-300 border-slate-600"
  }
}

function getTotalGrams(items: PurchaseLineItem[]) {
  return Math.round(items.reduce((total, item) => total + item.grams, 0) * 100) / 100
}

export default function PurchaseHistoryItem(props: PurchaseHistoryItemProps) {
  const { purchaseDate, dispensary, source, items, isOpen, onToggle } = props
  const totalGrams = getTotalGrams(items)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white">{purchaseDate}</p>
        </div>

        <div className="shrink-0 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-semibold text-slate-300">
          {isOpen ? "−" : "+"}
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-slate-700 px-4 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-white">
                {dispensary || "Dispensary not entered"}
              </h3>
              <p className="mt-1 text-xs text-slate-400">{source}</p>
            </div>

            <div className="text-right">
              <p className="text-lg font-bold text-emerald-400">{totalGrams}g</p>
              <p className="text-xs text-slate-400">total</p>
            </div>
          </div>

          <div className="mt-3 border-t border-slate-700 pt-3">
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Item {index + 1}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-white">
                        {item.productName}
                      </p>

                      <span
                        className={`mt-2 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getCategoryStyles(
                          item.category
                        )}`}
                      >
                        {item.category}
                      </span>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-400">
                        {item.grams}g
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}