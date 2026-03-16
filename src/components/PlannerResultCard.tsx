type PlannerResultCardProps = {
  title: string
  value: string
  detail: string
}

export default function PlannerResultCard(props: PlannerResultCardProps) {
  const { title, value, detail } = props

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-sm shadow-black/20">
      <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
        {title}
      </p>

      <h3 className="mt-1 text-xl font-bold text-emerald-400">
        {value}
      </h3>

      <p className="mt-2 text-xs leading-relaxed text-slate-300">
        {detail}
      </p>
    </div>
  )
}