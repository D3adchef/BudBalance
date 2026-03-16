type StatCardProps = {
  label: string
  value: string
  subtext?: string
}

export default function StatCard({ label, value, subtext }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-2xl p-4 border border-slate-700 shadow-sm">
      <p className="text-sm text-slate-400">{label}</p>
      <h2 className="text-3xl font-bold mt-2">{value}</h2>
      {subtext && <p className="text-xs text-slate-400 mt-2">{subtext}</p>}
    </div>
  )
}