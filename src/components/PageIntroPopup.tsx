import { useEffect, useState } from "react"
import { useAuthStore } from "../features/auth/authStore"

type PageIntroPopupProps = {
  pageKey: string
  title: string
  description: string
}

function getPopupStorageKey(username: string, pageKey: string) {
  return `budbalance-page-intro-${username.toLowerCase()}-${pageKey}`
}

export default function PageIntroPopup({
  pageKey,
  title,
  description,
}: PageIntroPopupProps) {
  const currentUser = useAuthStore((state) => state.currentUser)

  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  useEffect(() => {
    if (!currentUser) return

    const saved = localStorage.getItem(getPopupStorageKey(currentUser, pageKey))

    if (saved === "hidden") {
      setIsOpen(false)
      return
    }

    setIsOpen(true)
  }, [currentUser, pageKey])

  function handleClose() {
    if (currentUser && dontShowAgain) {
      localStorage.setItem(getPopupStorageKey(currentUser, pageKey), "hidden")
    }

    setIsOpen(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white"
          aria-label="Close popup"
        >
          ✕
        </button>

        <div className="pr-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            Quick Guide
          </p>

          <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>

          <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-slate-400">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Don’t show again
          </label>

          <button
            type="button"
            onClick={handleClose}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}