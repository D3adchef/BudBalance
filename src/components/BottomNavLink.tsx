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
      aria-label={label}
      title={label}
      className={({ isActive }) =>
        [
          "flex h-12 w-12 items-center justify-center rounded-2xl transition duration-200",
          isActive
            ? "bg-emerald-500/15 text-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.16)] ring-1 ring-emerald-400/20"
            : "text-slate-400 hover:bg-white/5 hover:text-white active:scale-[0.96]",
        ].join(" ")
      }
    >
      <span className="text-xl leading-none">{icon}</span>
    </NavLink>
  )
}