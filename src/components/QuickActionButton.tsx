import { Link } from "react-router-dom"

type QuickActionButtonProps = {
  to: string
  label: string
}

export default function QuickActionButton({
  to,
  label,
}: QuickActionButtonProps) {
  return (
    <Link
      to={to}
      className="
        flex items-center justify-center
        rounded-2xl
        border border-white/10
        bg-slate-900/90
        px-4 py-3
        text-sm font-semibold text-white
        shadow-sm shadow-black/20
        transition
        hover:bg-white/5
        hover:border-emerald-400/30
        active:scale-[0.97]
      "
    >
      {label}
    </Link>
  )
}