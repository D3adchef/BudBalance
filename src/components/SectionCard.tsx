import type { ReactNode } from "react"

type SectionCardProps = {
  title: string
  children: ReactNode
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-sm shadow-black/20">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>

      <div className="space-y-2.5">{children}</div>
    </section>
  )
}