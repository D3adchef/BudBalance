import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import PageIntroPopup from "../components/PageIntroPopup"
import { useAuthStore } from "../features/auth/authStore"
import { useFavoritesStore } from "../features/favorites/favoritesStore"
import { useSettingsStore } from "../features/settings/settingsStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

type OpenSection =
  | "account"
  | "allotment"
  | "dispensaries"
  | "purchases"
  | "help"
  | "glossary"
  | "contact"
  | null

type HelpKey =
  | "dashboard"
  | "planner"
  | "add"
  | "history"
  | "tools"
  | "calendar"
  | null

type GlossaryTerm = {
  term: string
  definition: string
}

type FavoritePurchaseInput = {
  name: string
  category: string
  grams: string
}

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

function formatMemberSince(dateString?: string) {
  if (!dateString) return "Unknown"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

const HELP_CONTENT: Record<
  Exclude<HelpKey, null>,
  { title: string; text: string }
> = {
  dashboard: {
    title: "Dashboard",
    text: "This page gives you a quick view of your current allotment, available grams, and recent activity. Use it as your home base to check your status and jump into Smart Planner or Add Purchase.",
  },
  planner: {
    title: "Smart Planner",
    text: "This page helps you see your current allotment, usage trends, and projected risk before your next refill. Use Purchase Builder to estimate what you can buy before heading to the dispensary.",
  },
  add: {
    title: "Add Purchase",
    text: "Use this page to manually enter a purchase or scan a receipt to speed things up. Add each item from the purchase so BudBalance can track your active grams correctly.",
  },
  history: {
    title: "Purchase History",
    text: "Review your saved purchases and open any entry to see product details and grams used. Older purchases stay here for reference, even after they roll out of your active 30-day window.",
  },
  tools: {
    title: "Tools",
    text: "Use this page to manage account details, save favorite dispensaries and favorite purchases, review help guides, and browse common dispensary terms in the glossary.",
  },
  calendar: {
    title: "30 Day Allotment Calendar",
    text: "Mississippi uses a rolling 30-day allotment system, not a calendar month. Your purchases count against your limit for exactly 30 days. Allotment returns based on the exact purchase timestamp, not just the date, so grams purchased at a specific time return 30 days later at that same time.",
  },
}

const GLOSSARY_TERMS: GlossaryTerm[] = [
  {
    term: "30 Day Allotment Window",
    definition:
      "Mississippi uses a rolling 30-day allotment system, not a calendar month. Your purchases count against your limit for exactly 30 days (720 hours). Each purchase returns to your available allotment at the exact same time it was made, not just on the same date. For example, a purchase made at 2:30 PM will return 30 days later at 2:30 PM.",
  },
  {
    term: "Cannabis Measurements",
    definition:
      "Common cannabis amounts are measured in grams. Typical conversions are 1g = 1 gram, 1/8 = 3.5 grams, 1/4 = 7 grams, 1/2 oz = 14 grams, and 1 oz = 28 grams.",
  },
  {
    term: "Indica",
    definition:
      "A strain label commonly associated with more relaxing or body-heavy effects.",
  },
  {
    term: "Sativa",
    definition:
      "A strain label commonly associated with more uplifting or energizing effects.",
  },
  {
    term: "Hybrid",
    definition:
      "A cannabis strain or product that combines indica and sativa traits.",
  },
  {
    term: "Flower",
    definition:
      "The dried cannabis bud that is commonly smoked or vaporized.",
  },
  {
    term: "Pre-Roll",
    definition:
      "A ready-made cannabis joint sold pre-filled and rolled.",
  },
  {
    term: "Edibles",
    definition:
      "Cannabis-infused food products such as gummies, chocolates, drinks, or chews.",
  },
  {
    term: "Concentrate",
    definition:
      "A highly potent cannabis extract such as wax, shatter, rosin, or resin.",
  },
  {
    term: "Vape",
    definition:
      "A cannabis oil product used in a vape cartridge or disposable device.",
  },
]

export default function ToolsPage() {
  const navigate = useNavigate()

  const logout = useAuthStore((state) => state.logout)
  const users = useAuthStore((state) => state.users)
  const currentUser = useAuthStore((state) => state.currentUser)
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser)
  const deleteCurrentUser = useAuthStore((state) => state.deleteCurrentUser)

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

  const allotmentLimit = useSettingsStore(
    (state) => state.settings.allotmentLimit
  )
  const loadSettingsForCurrentUser = useSettingsStore(
    (state) => state.loadSettingsForCurrentUser
  )

  const allotment = useAllotmentStore((state) => state.allotment)
  const loadAllotmentForCurrentUser = useAllotmentStore(
    (state) => state.loadAllotmentForCurrentUser
  )

  const [openSection, setOpenSection] = useState<OpenSection>(null)
  const [openHelp, setOpenHelp] = useState<HelpKey>(null)
  const [selectedGlossaryTerm, setSelectedGlossaryTerm] =
    useState<GlossaryTerm | null>(null)

  const [newDispensary, setNewDispensary] = useState("")
  const [favoritePurchaseInput, setFavoritePurchaseInput] =
    useState<FavoritePurchaseInput>({
      name: "",
      category: "",
      grams: "",
    })

  const [isEditingAccount, setIsEditingAccount] = useState(false)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editMobile, setEditMobile] = useState("")

  useEffect(() => {
    loadFavoritesForCurrentUser()
    loadSettingsForCurrentUser()
    loadAllotmentForCurrentUser()
  }, [
    loadFavoritesForCurrentUser,
    loadSettingsForCurrentUser,
    loadAllotmentForCurrentUser,
  ])

  const currentUserRecord = useMemo(() => {
    if (!currentUser) return null

    return (
      users.find(
        (user) => user.username.toLowerCase() === currentUser.toLowerCase()
      ) ?? null
    )
  }, [users, currentUser])

  useEffect(() => {
    if (!currentUserRecord) return

    setEditFirstName(currentUserRecord.firstName || "")
    setEditLastName(currentUserRecord.lastName || "")
    setEditEmail(currentUserRecord.email || "")
    setEditMobile(currentUserRecord.mobile || "")
  }, [currentUserRecord])

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function toggleHelpSection(section: Exclude<HelpKey, null>) {
    setOpenHelp((prev) => (prev === section ? null : section))
  }

  function handleAddDispensary() {
    const trimmed = newDispensary.trim()
    if (!trimmed) return

    addFavoriteDispensary(trimmed)
    setNewDispensary("")
  }

  function handleAddFavoritePurchase() {
    const trimmedName = favoritePurchaseInput.name.trim()
    const trimmedCategory = favoritePurchaseInput.category.trim()
    const grams = Number(favoritePurchaseInput.grams)

    if (!trimmedName || !trimmedCategory || !grams || grams <= 0) return

    addFavoritePurchase({
      name: trimmedName,
      category: trimmedCategory,
      grams,
    })

    setFavoritePurchaseInput({
      name: "",
      category: "",
      grams: "",
    })
  }

  function handleSaveAccount() {
    const result = updateCurrentUser({
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      mobile: editMobile,
    })

    if (!result.success) {
      alert(result.message)
      return
    }

    setIsEditingAccount(false)
  }

  function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this account? This cannot be undone."
    )

    if (!confirmed) return

    deleteCurrentUser()
    navigate("/login")
  }

  function handleLogout() {
    logout()
    navigate("/login")
  }

  function handleContactUs() {
    window.location.href = "mailto:j.marquis504@proton.me"
  }

  const setupMethodLabel =
    allotment.setupMode === "manual"
      ? "Manual starting allotment"
      : allotment.setupMode === "purchases"
        ? "Purchase-based setup"
        : "Not started"

  return (
    <>
      <PageIntroPopup
        pageKey="tools"
        title="Tools"
        description="Use this page to manage account details, save favorite dispensaries and favorite purchases, review help guides, and browse common dispensary terms in the glossary."
      />

      <div className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">Tools</h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your account, favorites, help guides, glossary, and support.
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
              {!isEditingAccount ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Username
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {currentUserRecord?.username || "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {[currentUserRecord?.firstName, currentUserRecord?.lastName]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {currentUserRecord?.email || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Mobile
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {currentUserRecord?.mobile || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Member Since
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatMemberSince(currentUserRecord?.createdAt)}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAccount(true)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Edit Account
                    </button>

                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                      Email
                    </label>
                    <input
                      type="email"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                      Mobile
                    </label>
                    <input
                      type="tel"
                      value={editMobile}
                      onChange={(e) => setEditMobile(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleSaveAccount}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Save Changes
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsEditingAccount(false)}
                      className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <CollapseHeader
            title="Allotment Setup"
            isOpen={openSection === "allotment"}
            onClick={() => toggleSection("allotment")}
          />

          {openSection === "allotment" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
              <div className="space-y-3">
                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Current Allotment Limit
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {allotmentLimit.toFixed(2)}g
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Setup Method
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {setupMethodLabel}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Initial Setup Status
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    {allotment.hasCompletedInitialSetup
                      ? "Completed"
                      : "Not completed"}
                  </p>
                </div>

                {allotment.manualStartingAllotment !== null && (
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Manual Starting Allotment
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {allotment.manualStartingAllotment.toFixed(2)}g
                    </p>
                  </div>
                )}

                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-3">
                  <p className="text-xs leading-5 text-slate-300">
                    If you started with a manual allotment, your dashboard and planner
                    will use that starting amount until purchase history is added.
                  </p>
                </div>
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDispensary}
                    onChange={(e) => setNewDispensary(e.target.value)}
                    placeholder="Add favorite dispensary"
                    className="flex-1 rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
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
                        <p className="text-sm text-white">{dispensary}</p>
                        <button
                          type="button"
                          onClick={() => removeFavoriteDispensary(dispensary)}
                          className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                    No favorite dispensaries saved yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <CollapseHeader
            title="Favorite Purchases"
            isOpen={openSection === "purchases"}
            onClick={() => toggleSection("purchases")}
          />

          {openSection === "purchases" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
              <div className="space-y-3">
                <input
                  type="text"
                  value={favoritePurchaseInput.name}
                  onChange={(e) =>
                    setFavoritePurchaseInput((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Favorite purchase name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                />

                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={favoritePurchaseInput.category}
                    onChange={(e) =>
                      setFavoritePurchaseInput((prev) => ({
                        ...prev,
                        category: e.target.value,
                      }))
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                  >
                    <option value="">Select category</option>
                    <option value="flower">Flower</option>
                    <option value="pre-roll">Pre-Roll</option>
                    <option value="edible">Edible</option>
                    <option value="vape">Vape</option>
                    <option value="concentrate">Concentrate</option>
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={favoritePurchaseInput.grams}
                    onChange={(e) =>
                      setFavoritePurchaseInput((prev) => ({
                        ...prev,
                        grams: e.target.value,
                      }))
                    }
                    placeholder="Grams"
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                  />
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
                    {favoritePurchases.map((purchase) => (
                      <div
                        key={purchase.id}
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {purchase.name}
                          </p>
                          <p className="text-xs text-slate-400">
                            {purchase.category} • {purchase.grams}g
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFavoritePurchase(purchase.id)}
                          className="text-xs font-semibold text-rose-300 transition hover:text-rose-200"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                    No favorite purchases saved yet.
                  </div>
                )}
              </div>
            </div>
          )}

          <CollapseHeader
            title="Help"
            isOpen={openSection === "help"}
            onClick={() => toggleSection("help")}
          />

          {openSection === "help" && (
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
              {(Object.keys(HELP_CONTENT) as Exclude<HelpKey, null>[]).map(
                (key) => (
                  <div key={key} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => toggleHelpSection(key)}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-left"
                    >
                      <span className="text-sm font-semibold text-white">
                        {HELP_CONTENT[key].title}
                      </span>
                      <span className="text-lg font-semibold text-emerald-400">
                        {openHelp === key ? "−" : "+"}
                      </span>
                    </button>

                    {openHelp === key && (
                      <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-4">
                        <p className="text-sm leading-6 text-slate-300">
                          {HELP_CONTENT[key].text}
                        </p>
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}

          <CollapseHeader
            title="Glossary"
            isOpen={openSection === "glossary"}
            onClick={() => toggleSection("glossary")}
          />

          {openSection === "glossary" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
              <p className="mb-3 text-xs text-slate-400">
                Tap any term to view its definition.
              </p>

              <div className="grid grid-cols-2 gap-2">
                {GLOSSARY_TERMS.map((entry) => (
                  <button
                    key={entry.term}
                    type="button"
                    onClick={() => setSelectedGlossaryTerm(entry)}
                    className="rounded-xl border border-white/10 bg-slate-950/50 px-3 py-2 text-left text-[12px] font-medium text-slate-200 transition hover:border-emerald-500/30 hover:text-white"
                  >
                    {entry.term}
                  </button>
                ))}
              </div>
            </div>
          )}

          <CollapseHeader
            title="Contact Us"
            isOpen={openSection === "contact"}
            onClick={() => toggleSection("contact")}
          />

          {openSection === "contact" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4">
              <p className="text-sm leading-6 text-slate-300">
                Questions, feedback, or ideas?
              </p>
              <button
                type="button"
                onClick={handleContactUs}
                className="mt-3 inline-block rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Contact Us
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
        >
          Log Out
        </button>
      </div>

      {selectedGlossaryTerm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={() => setSelectedGlossaryTerm(null)}
              className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white"
              aria-label="Close glossary definition"
            >
              ✕
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Glossary
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              {selectedGlossaryTerm.term}
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              {selectedGlossaryTerm.definition}
            </p>
          </div>
        </div>
      )}
    </>
  )
}