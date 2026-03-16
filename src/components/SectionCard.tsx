import type { ReactNode } from "react"

type SectionCardProps = {
  title: string
  children: ReactNode
}

export default function SectionCard({ title, children }: SectionCardProps) {
  return (
    <section className="bg-slate-800 rounded-2xl p-4 border border-slate-700">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </section>
  )
}