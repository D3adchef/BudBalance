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
    <div className="rounded-2xl border border-white/10 bg-slate-900/90 p-3.5 shadow-sm shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400">{purchaseDate}</p>
          <h3 className="mt-1 truncate text-sm font-semibold text-white">
            {productName}
          </h3>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-base font-bold text-emerald-400">{grams}g</p>
          <span className="mt-1 inline-block rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-300">
            {status}
          </span>
        </div>
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