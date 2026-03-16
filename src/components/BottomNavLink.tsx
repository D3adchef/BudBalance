import { NavLink } from "react-router-dom"
import type { ReactNode } from "react"

type BottomNavLinkProps = {
  to: string
  label: string
  icon: ReactNode
}

export default function BottomNavLink({
  to,
  label,
  icon,
}: BottomNavLinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-2 text-[11px] font-medium transition min-w-[64px]",
          isActive
            ? "bg-emerald-500/15 text-emerald-400"
            : "text-slate-400 hover:text-white hover:bg-slate-800/80",
        ].join(" ")
      }
    >
      <span className="text-lg leading-none">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}