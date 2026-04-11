import { useEffect, useState } from "react"
import { useAuthStore } from "../features/auth/authStore"
import { supabase } from "../lib/supabase"

type PageIntroPopupProps = {
  pageKey: string
  title: string
  description: string
}

export default function PageIntroPopup({
  pageKey,
  title,
  description,
}: PageIntroPopupProps) {
  const currentUser = useAuthStore((state) => state.currentUser)

  const [isOpen, setIsOpen] = useState(false)
  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const loadPopupPreference = async () => {
      if (!currentUser) {
        setIsOpen(false)
        setDontShowAgain(false)
        setIsLoading(false)
        return
      }

      setIsLoading(true)

      const { data, error } = await supabase
        .from("user_page_intro_preferences")
        .select("dont_show_again")
        .eq("user_id", currentUser.id)
        .eq("page_key", pageKey)
        .maybeSingle()

      if (error) {
        console.error("Failed to load popup preference:", error)
        setDontShowAgain(false)
        setIsOpen(true)
        setIsLoading(false)
        return
      }

      const savedPreference = Boolean(data?.dont_show_again)

      setDontShowAgain(savedPreference)
      setIsOpen(!savedPreference)
      setIsLoading(false)
    }

    loadPopupPreference()
  }, [currentUser, pageKey])

  async function handleClose() {
    if (!currentUser) {
      setIsOpen(false)
      return
    }

    setIsSaving(true)

    const { error } = await supabase
      .from("user_page_intro_preferences")
      .upsert(
        {
          user_id: currentUser.id,
          page_key: pageKey,
          dont_show_again: dontShowAgain,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,page_key",
        }
      )

    if (error) {
      console.error("Failed to save popup preference:", error)
    }

    setIsSaving(false)
    setIsOpen(false)
  }

  if (isLoading || !isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 px-4">
      <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
        <button
          type="button"
          onClick={handleClose}
          disabled={isSaving}
          className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
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
              disabled={isSaving}
              className="h-4 w-4 rounded border-white/10 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
            />
            Don’t show again
          </label>

          <button
            type="button"
            onClick={handleClose}
            disabled={isSaving}
            className="rounded-2xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Saving..." : "Got it"}
          </button>
        </div>
      </div>
    </div>
  )
}