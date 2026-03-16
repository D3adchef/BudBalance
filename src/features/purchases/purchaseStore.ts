import { create } from "zustand"
import { useAuthStore } from "../auth/authStore"

export type Purchase = {
  id: string
  purchaseDate: string
  grams: number
  productName: string
  dispensary: string
  notes: string
  source: string
}

type PurchaseStore = {
  purchases: Purchase[]
  loadPurchasesForCurrentUser: () => void
  addPurchase: (purchase: Purchase) => void
  clearPurchases: () => void
}

function getPurchaseStorageKey(username: string) {
  return `budbalance-purchases-${username.toLowerCase()}`
}

function loadPurchases(username: string): Purchase[] {
  const saved = localStorage.getItem(getPurchaseStorageKey(username))
  return saved ? JSON.parse(saved) : []
}

function savePurchases(username: string, purchases: Purchase[]) {
  localStorage.setItem(
    getPurchaseStorageKey(username),
    JSON.stringify(purchases)
  )
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  purchases: [],

  loadPurchasesForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ purchases: [] })
      return
    }

    const userPurchases = loadPurchases(currentUser)
    set({ purchases: userPurchases })
  },

  addPurchase: (purchase) => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) return

    const updatedPurchases = [purchase, ...get().purchases]

    savePurchases(currentUser, updatedPurchases)
    set({ purchases: updatedPurchases })
  },

  clearPurchases: () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ purchases: [] })
      return
    }

    savePurchases(currentUser, [])
    set({ purchases: [] })
  },
}))