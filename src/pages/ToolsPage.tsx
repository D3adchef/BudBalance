import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../features/auth/authStore"
import { useSettingsStore } from "../features/settings/settingsStore"
import { useFavoritesStore } from "../features/favorites/favoritesStore"

type OpenSection =
  | "account"
  | "dispensaries"
  | "favorites"
  | "help"
  | null

function CollapseHeader({
  title,
  isOpen,
  onClick,
}: {
  title: string
  isOpen: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-left transition hover:border-emerald-500/30"
    >
      <span className="text-sm font-semibold text-white">{title}</span>
      <span className="text-lg font-semibold text-emerald-400">
        {isOpen ? "−" : "+"}
      </span>
    </button>
  )
}

export default function ToolsPage() {
  const navigate = useNavigate()

  const currentUser = useAuthStore((state) => state.currentUser)
  const logout = useAuthStore((state) => state.logout)

  const allotmentLimit = useSettingsStore(
    (state) => state.settings.allotmentLimit
  )
  const setAllotmentLimit = useSettingsStore(
    (state) => state.setAllotmentLimit
  )

  const favoriteDispensaries = useFavoritesStore(
    (state) => state.favoriteDispensaries
  )
  const favoritePurchases = useFavoritesStore(
    (state) => state.favoritePurchases
  )
  const loadFavoritesForCurrentUser = useFavoritesStore(
    (state) => state.loadFavoritesForCurrentUser
  )
  const addFavoriteDispensary = useFavoritesStore(
    (state) => state.addFavoriteDispensary
  )
  const removeFavoriteDispensary = useFavoritesStore(
    (state) => state.removeFavoriteDispensary
  )
  const addFavoritePurchase = useFavoritesStore(
    (state) => state.addFavoritePurchase
  )
  const removeFavoritePurchase = useFavoritesStore(
    (state) => state.removeFavoritePurchase
  )

  const [openSection, setOpenSection] = useState<OpenSection>(null)
  const [allotmentInput, setAllotmentInput] = useState(
    allotmentLimit.toFixed(2)
  )

  const [dispensaryInput, setDispensaryInput] = useState("")

  const [favoritePurchaseName, setFavoritePurchaseName] = useState("")
  const [favoritePurchaseCategory, setFavoritePurchaseCategory] = useState("")
  const [favoritePurchaseGrams, setFavoritePurchaseGrams] = useState("")

  useEffect(() => {
    loadFavoritesForCurrentUser()
  }, [loadFavoritesForCurrentUser])

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function handleSaveAllotment() {
    const parsed = Number(allotmentInput)

    if (!parsed || parsed <= 0) {
      alert("Please enter a valid allotment amount.")
      return
    }

    setAllotmentLimit(parsed)
    setAllotmentInput(parsed.toFixed(2))
    alert("Allotment updated.")
  }

  function handleAddDispensary() {
    if (!dispensaryInput.trim()) {
      alert("Please enter a dispensary name.")
      return
    }

    addFavoriteDispensary(dispensaryInput)
    setDispensaryInput("")
  }

  function handleAddFavoritePurchase() {
    const grams = Number(favoritePurchaseGrams)

    if (!favoritePurchaseName.trim() || !favoritePurchaseCategory.trim() || grams <= 0) {
      alert("Please complete name, category, and grams.")
      return
    }

    addFavoritePurchase({
      name: favoritePurchaseName,
      category: favoritePurchaseCategory,
      grams,
    })

    setFavoritePurchaseName("")
    setFavoritePurchaseCategory("")
    setFavoritePurchaseGrams("")
  }

  function handleLogout() {
    logout()
    navigate("/login")
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
          BudBalance
        </p>
        <h1 className="mt-1 text-lg font-semibold text-white">Tools</h1>
        <p className="mt-1 text-xs text-slate-400">
          Manage account details, favorites, and app help.
        </p>
      </div>

      <div className="space-y-3">
        <CollapseHeader
          title="Account Info"
          isOpen={openSection === "account"}
          onClick={() => toggleSection("account")}
        />

        {openSection === "account" && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
            <div className="space-y-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  Logged In As
                </p>
                <p className="mt-1 text-sm font-semibold text-white">
                  {currentUser || "Unknown User"}
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Monthly Allotment
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={allotmentInput}
                  onChange={(e) => setAllotmentInput(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveAllotment}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
              >
                Save Allotment
              </button>
            </div>
          </div>
        )}

        <CollapseHeader
          title="Favorite Dispensaries"
          isOpen={openSection === "dispensaries"}
          onClick={() => toggleSection("dispensaries")}
        />

        {openSection === "dispensaries" && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={dispensaryInput}
                  onChange={(e) => setDispensaryInput(e.target.value)}
                  placeholder="Add favorite dispensary"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddDispensary}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Add
                </button>
              </div>

              {favoriteDispensaries.length > 0 ? (
                <div className="space-y-2">
                  {favoriteDispensaries.map((dispensary) => (
                    <div
                      key={dispensary}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3"
                    >
                      <p className="text-sm font-medium text-white">
                        {dispensary}
                      </p>

                      <button
                        type="button"
                        onClick={() => removeFavoriteDispensary(dispensary)}
                        className="text-xs font-semibold text-red-300 transition hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-slate-400">
                  No favorite dispensaries saved yet.
                </div>
              )}
            </div>
          </div>
        )}

        <CollapseHeader
          title="Favorite Purchases"
          isOpen={openSection === "favorites"}
          onClick={() => toggleSection("favorites")}
        />

        {openSection === "favorites" && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Favorite Purchase Name
                </label>
                <input
                  type="text"
                  value={favoritePurchaseName}
                  onChange={(e) => setFavoritePurchaseName(e.target.value)}
                  placeholder="Example: Usual Flower Eighth"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Category
                  </label>
                  <select
                    value={favoritePurchaseCategory}
                    onChange={(e) => setFavoritePurchaseCategory(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Select category</option>
                    <option value="flower">Flower</option>
                    <option value="pre-roll">Pre-Roll</option>
                    <option value="edible">Edible</option>
                    <option value="vape">Vape</option>
                    <option value="concentrate">Concentrate</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                    Grams
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={favoritePurchaseGrams}
                    onChange={(e) => setFavoritePurchaseGrams(e.target.value)}
                    placeholder="0.0"
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddFavoritePurchase}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Add Favorite Purchase
              </button>

              {favoritePurchases.length > 0 ? (
                <div className="space-y-2">
                  {favoritePurchases.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          {item.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {item.category} • {item.grams}g
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFavoritePurchase(item.id)}
                        className="shrink-0 text-xs font-semibold text-red-300 transition hover:text-red-200"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/30 px-4 py-4 text-sm text-slate-400">
                  No favorite purchases saved yet.
                </div>
              )}
            </div>
          </div>
        )}

        <CollapseHeader
          title="Help / Glossary"
          isOpen={openSection === "help"}
          onClick={() => toggleSection("help")}
        />

        {openSection === "help" && (
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
            <div className="space-y-2.5">
              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">Allotment:</span>{" "}
                  Your total allowed grams in the active rolling window.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">
                    Available Grams:
                  </span>{" "}
                  How many grams remain available to purchase right now.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">
                    Rolling 31-Day Window:
                  </span>{" "}
                  BudBalance tracks purchases across the most recent 31 days, not
                  a fixed calendar month.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">Roll-Off:</span>{" "}
                  When a purchase reaches day 31, its grams return to your
                  available balance.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                <p className="text-sm text-slate-200">
                  <span className="font-semibold text-white">Daily Pace:</span>{" "}
                  Your average grams purchased per day inside the current active
                  cycle.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={handleLogout}
        className="w-full rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/15"
      >
        Log Out
      </button>
    </div>
  )
}