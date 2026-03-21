import { useEffect } from "react"
import AppRouter from "./app/router"
import { useAuthStore } from "./features/auth/authStore"
import { usePurchaseStore } from "./features/purchases/purchaseStore"
import { useSettingsStore } from "./features/settings/settingsStore"
import { useAllotmentStore } from "./features/allotment/allotmentStore"
import { useFavoritesStore } from "./features/favorites/favoritesStore"

function App() {
  const currentUser = useAuthStore((state) => state.currentUser)
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

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  useEffect(() => {
    const loadGlobalUserData = async () => {
      try {
        await loadPurchasesForCurrentUser()
      } catch (error) {
        console.error("Failed to load purchases:", error)
      }

      try {
        await loadSettingsForCurrentUser()
      } catch (error) {
        console.error("Failed to load settings:", error)
      }

      try {
        await loadAllotmentForCurrentUser()
      } catch (error) {
        console.error("Failed to load allotment:", error)
      }

      try {
        await loadFavoritesForCurrentUser()
      } catch (error) {
        console.error("Failed to load favorites:", error)
      }
    }

    loadGlobalUserData()
  }, [
    currentUser,
    loadPurchasesForCurrentUser,
    loadSettingsForCurrentUser,
    loadAllotmentForCurrentUser,
    loadFavoritesForCurrentUser,
  ])

  return (
    <div className="min-h-screen bg-slate-900">
      <AppRouter />
    </div>
  )
}

export default App