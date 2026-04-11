import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import PageIntroPopup from "../components/PageIntroPopup"
import { supabase } from "../lib/supabase"
import { deleteCurrentAccount } from "../lib/deleteCurrentAccount"
import { useAuthStore } from "../features/auth/authStore"
import { useFavoritesStore } from "../features/favorites/favoritesStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

type OpenSection =
  | "account"
  | "dispensaries"
  | "purchases"
  | "help"
  | "glossary"
  | "terms"
  | "privacy"
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

type ProfileRecord = {
  id: string
  email: string | null
  first_name: string | null
  last_name: string | null
  username: string | null
  birth_month: string | null
  birth_day: string | null
  birth_year: string | null
  mobile: string | null
  created_at: string | null
}

const PRIVACY_POLICY_URL = "https://d3adchef.github.io/BudBalance/privacy.html"
const TERMS_OF_USE_URL = "https://d3adchef.github.io/BudBalance/terms.html"

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

function formatMemberSince(dateString?: string | null) {
  if (!dateString) return "Unknown"

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return "Unknown"

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })
}

function isStrongPassword(password: string) {
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumber = /\d/.test(password)
  const hasSpecialCharacter = /[^A-Za-z0-9]/.test(password)
  const hasMinimumLength = password.length >= 6

  return (
    hasUppercase &&
    hasNumber &&
    hasSpecialCharacter &&
    hasMinimumLength
  )
}

const HELP_CONTENT: Record<
  Exclude<HelpKey, null>,
  { title: string; text: string }
> = {
  dashboard: {
    title: "Dashboard",
    text: "This page gives you a quick view of your current allotment, available grams, and recent activity. Use it as your home base to check your status and jump into Smart Planner or Add Visit.",
  },
  planner: {
    title: "Smart Planner",
    text: "This page helps you see your current allotment, usage trends, and projected risk before your next refill. Use Allotment Builder to preview how entries may affect your remaining allotment.",
  },
  add: {
    title: "Add Visit",
    text: "Use this page to manually log a visit or scan a receipt to speed things up. Add each item from the visit so BudBalance can track your active grams correctly.",
  },
  history: {
    title: "Visit History",
    text: "Review your saved visits and open any entry to see product details and grams used. Older visits stay here for reference, even after they roll out of your active 30-day window.",
  },
  tools: {
    title: "Tools",
    text: "Use this page to manage account details, save favorite dispensaries and favorite items, review help guides, and browse common dispensary terms in the glossary.",
  },
  calendar: {
    title: "30 Day Allotment Calendar",
    text: "Mississippi uses a rolling 30-day allotment system, not a calendar month. Your visits count against your limit for exactly 30 days. Allotment returns based on the exact visit timestamp, not just the date, so grams recorded at a specific time return 30 days later at that same time.",
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
  const currentUser = useAuthStore((state) => state.currentUser)
  const updateCurrentUser = useAuthStore((state) => state.updateCurrentUser)
  const updateCurrentUserPassword = useAuthStore(
    (state) => state.updateCurrentUserPassword
  )

  const favoriteDispensaries = useFavoritesStore(
    (state) => state.favoriteDispensaries
  )
  const favoritePurchases = useFavoritesStore(
    (state) => state.favoritePurchases
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

  const allotment = useAllotmentStore((state) => state.allotment)
  const adjustCurrentAllotment = useAllotmentStore(
    (state) => state.adjustCurrentAllotment
  )

  const [profile, setProfile] = useState<ProfileRecord | null>(null)
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
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editEmail, setEditEmail] = useState("")
  const [editMobile, setEditMobile] = useState("")

  const [currentPasswordInput, setCurrentPasswordInput] = useState("")
  const [newPasswordInput, setNewPasswordInput] = useState("")
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("")
  const [passwordMessage, setPasswordMessage] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false)

  const [favoritesError, setFavoritesError] = useState("")
  const [isSavingDispensary, setIsSavingDispensary] = useState(false)
  const [isSavingPurchase, setIsSavingPurchase] = useState(false)
  const [removingDispensaryName, setRemovingDispensaryName] = useState("")
  const [removingPurchaseId, setRemovingPurchaseId] = useState("")

  const [isAllotmentModalOpen, setIsAllotmentModalOpen] = useState(false)
  const [adjustedAllotmentInput, setAdjustedAllotmentInput] = useState("")
  const [isSavingAdjustedAllotment, setIsSavingAdjustedAllotment] =
    useState(false)
  const [adjustAllotmentError, setAdjustAllotmentError] = useState("")
  const [adjustAllotmentMessage, setAdjustAllotmentMessage] = useState("")

  useEffect(() => {
    const loadProfile = async () => {
      if (!currentUser) {
        setProfile(null)
        return
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle()

      if (error) {
        console.error("Failed to load profile:", error)
        setProfile(null)
        return
      }

      setProfile(data ?? null)
    }

    loadProfile()
  }, [currentUser])

  useEffect(() => {
    setEditFirstName(profile?.first_name || "")
    setEditLastName(profile?.last_name || "")
    setEditEmail(profile?.email || currentUser?.email || "")
    setEditMobile(profile?.mobile || "")
  }, [profile, currentUser])

  useEffect(() => {
    const currentValue =
      allotment.correctedCurrentAllotment !== null
        ? allotment.correctedCurrentAllotment.toFixed(2)
        : ""

    setAdjustedAllotmentInput(currentValue)
  }, [allotment.correctedCurrentAllotment])

  function toggleSection(section: Exclude<OpenSection, null>) {
    setOpenSection((prev) => (prev === section ? null : section))
  }

  function toggleHelpSection(section: Exclude<HelpKey, null>) {
    setOpenHelp((prev) => (prev === section ? null : section))
  }

  function openExternalUrl(url: string) {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  async function handleAddDispensary() {
    const trimmed = newDispensary.trim()
    if (!trimmed) return

    setFavoritesError("")
    setIsSavingDispensary(true)

    try {
      await addFavoriteDispensary(trimmed)
      setNewDispensary("")
    } catch (error) {
      console.error("Failed to save favorite dispensary:", error)
      setFavoritesError("Unable to save favorite dispensary.")
    } finally {
      setIsSavingDispensary(false)
    }
  }

  async function handleRemoveDispensary(dispensary: string) {
    setFavoritesError("")
    setRemovingDispensaryName(dispensary)

    try {
      await removeFavoriteDispensary(dispensary)
    } catch (error) {
      console.error("Failed to remove favorite dispensary:", error)
      setFavoritesError("Unable to remove favorite dispensary.")
    } finally {
      setRemovingDispensaryName("")
    }
  }

  async function handleAddFavoritePurchase() {
    const trimmedName = favoritePurchaseInput.name.trim()
    const trimmedCategory = favoritePurchaseInput.category.trim()
    const grams = Number(favoritePurchaseInput.grams)

    if (!trimmedName || !trimmedCategory || !grams || grams <= 0) return

    setFavoritesError("")
    setIsSavingPurchase(true)

    try {
      await addFavoritePurchase({
        name: trimmedName,
        category: trimmedCategory,
        grams,
      })

      setFavoritePurchaseInput({
        name: "",
        category: "",
        grams: "",
      })
    } catch (error) {
      console.error("Failed to save favorite purchase:", error)
      setFavoritesError("Unable to save favorite item.")
    } finally {
      setIsSavingPurchase(false)
    }
  }

  async function handleRemoveFavoritePurchase(purchaseId: string) {
    setFavoritesError("")
    setRemovingPurchaseId(purchaseId)

    try {
      await removeFavoritePurchase(purchaseId)
    } catch (error) {
      console.error("Failed to remove favorite purchase:", error)
      setFavoritesError("Unable to remove favorite item.")
    } finally {
      setRemovingPurchaseId("")
    }
  }

  async function handleSaveAccount() {
    const result = await updateCurrentUser({
      firstName: editFirstName,
      lastName: editLastName,
      email: editEmail,
      mobile: editMobile,
    })

    if (!result.success) {
      alert(result.message)
      return
    }

    if (currentUser) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", currentUser.id)
        .maybeSingle()

      setProfile(data ?? null)
    }

    setIsEditingAccount(false)
  }

  function openPasswordModal() {
    setPasswordMessage("")
    setPasswordError("")
    setCurrentPasswordInput("")
    setNewPasswordInput("")
    setConfirmNewPasswordInput("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
    setIsPasswordModalOpen(true)
  }

  function closePasswordModal() {
    if (isUpdatingPassword) return
    setIsPasswordModalOpen(false)
    setPasswordMessage("")
    setPasswordError("")
    setCurrentPasswordInput("")
    setNewPasswordInput("")
    setConfirmNewPasswordInput("")
    setShowCurrentPassword(false)
    setShowNewPassword(false)
    setShowConfirmNewPassword(false)
  }

  async function handleUpdatePassword() {
    setPasswordMessage("")
    setPasswordError("")

    const trimmedCurrentPassword = currentPasswordInput.trim()
    const trimmedNewPassword = newPasswordInput.trim()
    const trimmedConfirmPassword = confirmNewPasswordInput.trim()

    if (
      !trimmedCurrentPassword ||
      !trimmedNewPassword ||
      !trimmedConfirmPassword
    ) {
      setPasswordError("Please complete all password fields.")
      return
    }

    if (!isStrongPassword(trimmedNewPassword)) {
      setPasswordError(
        "New password must include at least 6 characters, 1 uppercase letter, 1 number, and 1 special character."
      )
      return
    }

    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setPasswordError("New passwords do not match.")
      return
    }

    if (trimmedCurrentPassword === trimmedNewPassword) {
      setPasswordError("New password must be different from the current password.")
      return
    }

    setIsUpdatingPassword(true)

    const result = await updateCurrentUserPassword(
      trimmedCurrentPassword,
      trimmedNewPassword
    )

    setIsUpdatingPassword(false)

    if (!result.success) {
      setPasswordError(result.message)
      return
    }

    setPasswordMessage(result.message)
    setCurrentPasswordInput("")
    setNewPasswordInput("")
    setConfirmNewPasswordInput("")
  }

  function openAllotmentModal() {
    setAdjustAllotmentError("")
    setAdjustAllotmentMessage("")
    setAdjustedAllotmentInput(
      allotment.correctedCurrentAllotment !== null
        ? allotment.correctedCurrentAllotment.toFixed(2)
        : ""
    )
    setIsAllotmentModalOpen(true)
  }

  function closeAllotmentModal() {
    if (isSavingAdjustedAllotment) return
    setIsAllotmentModalOpen(false)
    setAdjustAllotmentError("")
    setAdjustAllotmentMessage("")
  }

  async function handleAdjustAllotment() {
    setAdjustAllotmentError("")
    setAdjustAllotmentMessage("")

    const safeGrams = Number(adjustedAllotmentInput)

    if (Number.isNaN(safeGrams) || safeGrams < 0) {
      setAdjustAllotmentError("Please enter a valid allotment amount.")
      return
    }

    const secondWarning = window.confirm(
      "Are you sure? This should only be used if your current BudBalance allotment does not match your real available allotment."
    )

    if (!secondWarning) return

    setIsSavingAdjustedAllotment(true)

    try {
      await adjustCurrentAllotment(safeGrams)
      setAdjustAllotmentMessage("Current allotment updated successfully.")
      setTimeout(() => {
        setIsAllotmentModalOpen(false)
        setAdjustAllotmentMessage("")
      }, 900)
    } catch (error) {
      console.error("Failed to adjust allotment:", error)
      setAdjustAllotmentError("Unable to update allotment right now.")
    } finally {
      setIsSavingAdjustedAllotment(false)
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Are you sure you want to permanently delete this account and all BudBalance data? This cannot be undone."
    )

    if (!confirmed) return

    try {
      setIsDeletingAccount(true)

      await deleteCurrentAccount()

      await logout()
      navigate("/login", { replace: true })
    } catch (error) {
      console.error("Failed to delete account:", error)
      alert("Failed to delete account. Please try again.")
    } finally {
      setIsDeletingAccount(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  function handleContactUs() {
    window.location.href =
      "mailto:budbalance@proton.me?subject=BudBalance Contact"
  }

  function handleReportIssueSuggestion() {
    window.location.href =
      "mailto:budbalance-feedback@proton.me?subject=BudBalance Issue or Suggestion"
  }

  return (
    <>
      <PageIntroPopup
        pageKey="tools"
        title="Tools"
        description="Use this page to manage account details, save favorite dispensaries and favorite items, review help guides, browse common dispensary terms in the glossary, and review app policies."
      />

      <div className="mx-auto w-full max-w-[820px] space-y-4 px-1 md:px-2">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <h1 className="mt-1 text-lg font-semibold text-white">Tools</h1>
          <p className="mt-1 text-xs text-slate-400">
            Manage your account, favorites, help guides, glossary, policies, and
            support.
          </p>
        </div>

        {favoritesError && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {favoritesError}
          </div>
        )}

        <div className="space-y-3">
          <CollapseHeader
            title="Account Info"
            isOpen={openSection === "account"}
            onClick={() => toggleSection("account")}
          />

          {openSection === "account" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              {!isEditingAccount ? (
                <div className="space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Username
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile?.username || "Unknown"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Name
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {[profile?.first_name, profile?.last_name]
                        .filter(Boolean)
                        .join(" ") || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Email
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile?.email || currentUser?.email || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-slate-950/50 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-slate-400">
                      Mobile
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {profile?.mobile || "Not provided"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Member Since
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {formatMemberSince(
                        profile?.created_at || currentUser?.created_at
                      )}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingAccount(true)}
                      className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                    >
                      Edit Account
                    </button>

                    <button
                      type="button"
                      onClick={openAllotmentModal}
                      className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                    >
                      Correct Current Allotment
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={openPasswordModal}
                      className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      Update Password
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

                  <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
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
            title="Favorite Dispensaries"
            isOpen={openSection === "dispensaries"}
            onClick={() => toggleSection("dispensaries")}
          />

          {openSection === "dispensaries" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              <div className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row">
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
                    disabled={isSavingDispensary}
                    className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSavingDispensary ? "Saving..." : "Add"}
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
                          onClick={() => handleRemoveDispensary(dispensary)}
                          disabled={removingDispensaryName === dispensary}
                          className="text-xs font-semibold text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingDispensaryName === dispensary
                            ? "Removing..."
                            : "Remove"}
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
            title="Favorite Items"
            isOpen={openSection === "purchases"}
            onClick={() => toggleSection("purchases")}
          />

          {openSection === "purchases" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
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
                  placeholder="Item name"
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                  disabled={isSavingPurchase}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingPurchase ? "Saving..." : "Add Favorite Item"}
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
                          onClick={() =>
                            handleRemoveFavoritePurchase(purchase.id)
                          }
                          disabled={removingPurchaseId === purchase.id}
                          className="text-xs font-semibold text-rose-300 transition hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {removingPurchaseId === purchase.id
                            ? "Removing..."
                            : "Remove"}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-white/10 bg-slate-950/40 px-4 py-4 text-sm text-slate-400">
                    No favorite items saved yet.
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
            <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
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
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              <p className="mb-3 text-xs text-slate-400">
                Tap any term to view its definition.
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
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
            title="Terms of Use"
            isOpen={openSection === "terms"}
            onClick={() => toggleSection("terms")}
          />

          {openSection === "terms" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Last Updated
                    </p>
                    <p className="mt-1 text-sm text-white">April 2026</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openExternalUrl(TERMS_OF_USE_URL)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                  >
                    Open Full Web Version
                  </button>
                </div>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    1. Use of the App
                  </h3>
                  <p className="mt-1">
                    BudBalance is provided for personal, non-commercial use.
                    You agree to use the app only for lawful purposes and in a
                    way that does not infringe on the rights of others.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    2. User Accounts
                  </h3>
                  <p className="mt-1">
                    You are responsible for maintaining the confidentiality of
                    your account and login information. You are responsible for
                    all activity that occurs under your account.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    3. User Data
                  </h3>
                  <p className="mt-1">
                    You may store personal data such as purchase history,
                    preferences, scanned receipt details, and account details.
                    You are responsible for the accuracy of the information you
                    provide.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    4. Account Deletion
                  </h3>
                  <p className="mt-1">
                    You may delete your account at any time using the in-app
                    delete feature. Upon deletion, your account and stored data
                    will be permanently removed from BudBalance systems, subject
                    to any limited retention required for security, fraud
                    prevention, or legal compliance.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    5. No Medical or Legal Advice
                  </h3>
                  <p className="mt-1">
                    BudBalance does not provide medical, legal, or professional
                    advice. Any information shown in the app is provided for
                    general informational and personal tracking purposes only.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    6. Limitation of Liability
                  </h3>
                  <p className="mt-1">
                    BudBalance is provided &quot;as is&quot; without warranties
                    of any kind, express or implied. We are not responsible for
                    any damages resulting from the use of, or inability to use,
                    the app.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    7. Changes to Terms
                  </h3>
                  <p className="mt-1">
                    We may update these Terms of Use from time to time.
                    Continued use of the app after updated terms are posted
                    constitutes acceptance of those changes.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">8. Contact</h3>
                  <p className="mt-1">
                    Questions about these Terms of Use may be sent to:
                  </p>
                  <p className="mt-1 text-emerald-300">
                    budbalance@proton.me
                  </p>
                </section>
              </div>
            </div>
          )}

          <CollapseHeader
            title="Privacy Policy"
            isOpen={openSection === "privacy"}
            onClick={() => toggleSection("privacy")}
          />

          {openSection === "privacy" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              <div className="space-y-4 text-sm leading-6 text-slate-300">
                <div className="flex flex-col items-start justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="text-[11px] uppercase tracking-wide text-emerald-300">
                      Last Updated
                    </p>
                    <p className="mt-1 text-sm text-white">April 2026</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => openExternalUrl(PRIVACY_POLICY_URL)}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 transition hover:bg-emerald-500/15"
                  >
                    Open Full Web Version
                  </button>
                </div>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    1. Information We Collect
                  </h3>
                  <p className="mt-1">
                    We may collect account information such as email, username,
                    and other details you choose to provide. We also store
                    user-generated content such as purchase history, favorites,
                    preferences, and other information you enter into the app.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    2. Camera and Receipt Scanning
                  </h3>
                  <p className="mt-1">
                    If you choose to use BudBalance receipt scanning features,
                    the app may request access to your device camera so you can
                    capture receipt images. This access is used only to support
                    receipt scanning and purchase entry features. Receipt images
                    and extracted text are used to help populate purchase
                    details. We do not sell receipt data.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    3. How We Use Information
                  </h3>
                  <p className="mt-1">
                    We use your information to provide and maintain the app,
                    create and manage your account, save your preferences and
                    purchase history, support receipt scanning, improve app
                    functionality, and respond to support requests.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    4. Data Storage and Service Providers
                  </h3>
                  <p className="mt-1">
                    BudBalance uses Supabase as a backend service provider for
                    authentication, account data, and synced app data storage.
                    We take reasonable measures to protect your information, but
                    no method of storage or transmission can be guaranteed to be
                    completely secure.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    5. Data Sharing
                  </h3>
                  <p className="mt-1">
                    We do not sell your personal information. We do not share
                    your personal data with third parties for advertising or
                    marketing purposes. We may rely on service providers that
                    help us operate the app, such as hosting, authentication,
                    and storage providers.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    6. Data Retention
                  </h3>
                  <p className="mt-1">
                    We retain your account information and app data for as long
                    as your account remains active, or as needed to provide the
                    app. If you delete your account using the in-app delete
                    feature, your account and associated data are permanently
                    removed from BudBalance systems, subject to any limited
                    retention required for security, fraud prevention, or legal
                    compliance.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    7. Your Choices and Account Deletion
                  </h3>
                  <p className="mt-1">
                    You may review, update, or delete certain account details
                    within the app. You may also delete your account at any time
                    using the in-app delete feature.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    8. Security
                  </h3>
                  <p className="mt-1">
                    We implement reasonable administrative, technical, and
                    organizational safeguards designed to protect your
                    information. However, no system is 100% secure.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    9. Children&apos;s Privacy
                  </h3>
                  <p className="mt-1">
                    BudBalance is not intended for users under the age of 18.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">
                    10. Changes to This Policy
                  </h3>
                  <p className="mt-1">
                    We may update this Privacy Policy from time to time.
                    Continued use of the app after an updated policy is posted
                    means you accept those changes.
                  </p>
                </section>

                <section>
                  <h3 className="text-sm font-semibold text-white">11. Contact</h3>
                  <p className="mt-1">
                    Questions about this Privacy Policy may be sent to:
                  </p>
                  <p className="mt-1 text-emerald-300">
                    budbalance@proton.me
                  </p>
                </section>
              </div>
            </div>
          )}

          <CollapseHeader
            title="Contact Us"
            isOpen={openSection === "contact"}
            onClick={() => toggleSection("contact")}
          />

          {openSection === "contact" && (
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-4 md:px-5 md:py-5">
              <p className="text-sm leading-6 text-slate-300">
                Questions, feedback, or ideas?
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleContactUs}
                  className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
                >
                  Contact Us
                </button>

                <button
                  type="button"
                  onClick={handleReportIssueSuggestion}
                  className="rounded-2xl border border-white/10 bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Report an Issue / Suggestion
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-4 md:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400">
              Account Actions
            </p>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-3 w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15"
            >
              Log Out
            </button>
          </div>

          <div className="rounded-2xl border border-rose-500/25 bg-rose-500/5 px-4 py-4 md:px-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-rose-300">
              Danger Zone
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Permanently delete your account and all associated BudBalance
              data. This action cannot be undone.
            </p>

            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeletingAccount}
              className="mt-4 w-full rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeletingAccount ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>

      {isAllotmentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={closeAllotmentModal}
              className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white"
              aria-label="Close current allotment correction"
            >
              ✕
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Account Correction
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Correct Current Allotment
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Enter your real current available allotment. This will become your
              new baseline as of right now.
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-400">
              Any purchases you add later that are timestamped before this
              moment will be saved to your history, but they will not subtract
              from this amount.
            </p>

            {adjustAllotmentMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {adjustAllotmentMessage}
              </div>
            )}

            {adjustAllotmentError && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {adjustAllotmentError}
              </div>
            )}

            <div className="mt-4">
              <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                Current Available Allotment
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={adjustedAllotmentInput}
                onChange={(e) => setAdjustedAllotmentInput(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeAllotmentModal}
                disabled={isSavingAdjustedAllotment}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAdjustAllotment}
                disabled={isSavingAdjustedAllotment}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSavingAdjustedAllotment ? "Saving..." : "Update Current"}
              </button>
            </div>
          </div>
        </div>
      )}

      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-5 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <button
              type="button"
              onClick={closePasswordModal}
              className="absolute right-4 top-4 text-sm text-slate-400 transition hover:text-white"
              aria-label="Close password update"
            >
              ✕
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
              Account Security
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              Update Password
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Enter your current password, then choose a new password with at
              least one uppercase letter, one number, and one special character.
            </p>

            {passwordMessage && (
              <div className="mt-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                {passwordMessage}
              </div>
            )}

            {passwordError && (
              <div className="mt-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {passwordError}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPasswordInput}
                    onChange={(e) => setCurrentPasswordInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 pr-12 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition hover:text-white"
                    aria-label={
                      showCurrentPassword
                        ? "Hide current password"
                        : "Show current password"
                    }
                  >
                    {showCurrentPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPasswordInput}
                    onChange={(e) => setNewPasswordInput(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 pr-12 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition hover:text-white"
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-[11px] uppercase tracking-wide text-slate-400">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPasswordInput}
                    onChange={(e) =>
                      setConfirmNewPasswordInput(e.target.value)
                    }
                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 pr-12 text-sm text-white outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setShowConfirmNewPassword((prev) => !prev)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-slate-400 transition hover:text-white"
                    aria-label={
                      showConfirmNewPassword
                        ? "Hide confirm new password"
                        : "Show confirm new password"
                    }
                  >
                    {showConfirmNewPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closePasswordModal}
                disabled={isUpdatingPassword}
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUpdatePassword}
                disabled={isUpdatingPassword}
                className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </div>
          </div>
        </div>
      )}

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