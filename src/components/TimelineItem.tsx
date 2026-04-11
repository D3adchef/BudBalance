type TimelineLineItem = {
  id: string
  productName: string
  category: string
  grams: number
}

type TimelineItemProps = {
  purchaseDate: string
  dispensary: string
  items: TimelineLineItem[]
  grams: number
  rollOffDate: string
  daysUntilRollOff: number
  status: string
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

export default function TimelineItem(props: TimelineItemProps) {
  const {
    purchaseDate,
    dispensary,
    items,
    grams,
    rollOffDate,
    daysUntilRollOff,
    status,
  } = props

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400">{purchaseDate}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-white">
            {dispensary || "Saved Purchase"}
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">
            {items.length} item{items.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-emerald-400">{grams}g</p>
          <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
            {status}
          </span>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {items.slice(0, 3).map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/70 px-3 py-2"
          >
            <div className="min-w-0 pr-3">
              <p className="truncate text-xs font-medium text-white">
                {item.productName}
              </p>

              <span
                className={`mt-1 inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${getCategoryStyles(
                  item.category || ""
                )}`}
              >
                {item.category || "—"}
              </span>
            </div>

            <span className="shrink-0 text-xs font-semibold text-emerald-400">
              {item.grams}g
            </span>
          </div>
        ))}

        {items.length > 3 && (
          <p className="text-[11px] text-slate-500">
            +{items.length - 3} more item{items.length - 3 === 1 ? "" : "s"}
          </p>
        )}
      </div>

      <div className="mt-3 border-t border-white/10 pt-2.5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Rolls Off
            </p>
            <p className="truncate text-xs font-medium text-slate-300">
              {rollOffDate}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] uppercase tracking-wide text-slate-500">
              Remaining
            </p>
            <p className="text-xs font-medium text-slate-300">
              {daysUntilRollOff} day{daysUntilRollOff === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}