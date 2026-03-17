import { useEffect } from "react"
import AppRouter from "./app/router"
import { useAuthStore } from "./features/auth/authStore"
import { usePurchaseStore } from "./features/purchases/purchaseStore"
import { useSettingsStore } from "./features/settings/settingsStore"

function App() {
  const currentUser = useAuthStore((state) => state.currentUser)

  const loadPurchasesForCurrentUser = usePurchaseStore(
    (state) => state.loadPurchasesForCurrentUser
  )

  const loadSettingsForCurrentUser = useSettingsStore(
    (state) => state.loadSettingsForCurrentUser
  )

  useEffect(() => {
    loadPurchasesForCurrentUser()
    loadSettingsForCurrentUser()
  }, [currentUser, loadPurchasesForCurrentUser, loadSettingsForCurrentUser])

  return (
    <div className="min-h-screen bg-slate-900">
      <AppRouter />
    </div>
  )
}

export default App