import { useNavigate } from "react-router-dom"

export default function OnboardingCarryInPage() {
  const navigate = useNavigate()

  function handleAddActivePurchases() {
    navigate("/add-purchase")
  }

  function handleSkipForNow() {
    navigate("/")
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black px-4 py-8 text-white">
      <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>

          <h1 className="mt-2 text-lg font-semibold text-white">
            Add Active Purchases
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-300">
            If you already have purchases still counting against your current
            31-day allotment, add them now so BudBalance can store the correct
            return dates and amounts.
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-4">
          <p className="text-sm text-slate-300">
            You can skip this for now and add them later, but entering them now
            will make your Smart Planner and allotment tracking more accurate
            from day one.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleAddActivePurchases}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97]"
          >
            Add Purchases
          </button>

          <button
            type="button"
            onClick={handleSkipForNow}
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97]"
          >
            Skip for Now
          </button>
        </div>
      </div>
    </div>
  )
}