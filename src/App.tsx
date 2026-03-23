import { useEffect, useState } from "react"
import AppRouter from "./app/router"
import { useAuthStore } from "./features/auth/authStore"
import { usePurchaseStore } from "./features/purchases/purchaseStore"
import { useSettingsStore } from "./features/settings/settingsStore"
import { useAllotmentStore } from "./features/allotment/allotmentStore"
import { useFavoritesStore } from "./features/favorites/favoritesStore"

function App() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const isAuthReady = useAuthStore((state) => state.isAuthReady)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )

  const loadSettingsForCurrentUser = useSettingsStore(
    (state) => state.loadSettingsForCurrentUser
  )

  const loadAllotmentForCurrentUser = useAllotmentStore(
    (state) => state.loadAllotmentForCurrentUser
  )

  const loadFavoritesForCurrentUser = useFavoritesStore(
    (state) => state.loadFavoritesForCurrentUser
  )

  const [isAppReady, setIsAppReady] = useState(false)

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    async function loadGlobalUserData() {
      if (!isAuthReady) {
        return
      }

      if (!currentUser) {
        setIsAppReady(true)
        return
      }

      setIsAppReady(false)

      try {
        await Promise.all([
          loadPurchasesForCurrentUser(),
          loadSettingsForCurrentUser(),
          loadAllotmentForCurrentUser(),
          loadFavoritesForCurrentUser(),
        ])
      } catch (error) {
        console.error("Failed to load user data:", error)
      } finally {
        setIsAppReady(true)
      }
    }

    loadGlobalUserData()
  }, [
    isAuthReady,
    currentUser,
    loadPurchasesForCurrentUser,
    loadSettingsForCurrentUser,
    loadAllotmentForCurrentUser,
    loadFavoritesForCurrentUser,
  ])

  if (!isAuthReady || !isAppReady) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 px-6 py-5 text-center shadow-lg shadow-black/20">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <p className="mt-2 text-sm text-slate-300">Loading your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <AppRouter />
    </div>
  )
}

export default App