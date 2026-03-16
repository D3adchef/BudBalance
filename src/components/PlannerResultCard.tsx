type PlannerResultCardProps = {
  title: string
  value: string
  detail: string
}

export default function PlannerResultCard(props: PlannerResultCardProps) {
  const { title, value, detail } = props

  return (
    <div className="rounded-2xl border border-slate-700 bg-slate-800 p-4">
      <p className="text-sm text-slate-400">{title}</p>
      <h3 className="mt-2 text-2xl font-bold text-emerald-400">{value}</h3>
      <p className="mt-2 text-sm text-slate-300">{detail}</p>
    </div>
  )
}