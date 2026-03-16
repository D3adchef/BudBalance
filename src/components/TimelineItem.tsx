type TimelineItemProps = {
  purchaseDate: string
  productName: string
  grams: number
  rollOffDate: string
  daysUntilRollOff: number
  status: string
}

export default function TimelineItem(props: TimelineItemProps) {
  const {
    purchaseDate,
    productName,
    grams,
    rollOffDate,
    daysUntilRollOff,
    status,
  } = props

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{purchaseDate}</p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {productName}
          </h3>
        </div>

        <div className="text-right">
          <p className="text-lg font-bold text-emerald-400">{grams}g</p>
          <p className="text-xs text-slate-400">{status}</p>
        </div>
      </div>

      <div className="mt-3 border-t border-slate-700 pt-3 space-y-1">
        <p className="text-sm text-slate-300">Rolls off: {rollOffDate}</p>
        <p className="text-xs text-slate-400">
          {daysUntilRollOff} day{daysUntilRollOff === 1 ? "" : "s"} remaining
        </p>
      </div>
    </div>
  )
}