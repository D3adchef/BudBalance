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
      className="flex items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-500"
    >
      {label}
    </Link>
  )
}