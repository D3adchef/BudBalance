import { create } from "zustand"
import { useAuthStore } from "../auth/authStore"

export type PurchaseItem = {
  id: string
  productName: string
  category: string
  grams: number
}

export type PurchaseEntryMode = "setup" | "manual" | "scan" | "historical"

export type Purchase = {
  id: string
  purchaseDate: string
  dispensary: string
  notes: string
  source: string
  items: PurchaseItem[]
  countsTowardAllotment: boolean
  entryMode: PurchaseEntryMode
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

function normalizeEntryMode(raw: any): PurchaseEntryMode {
  if (
    raw === "setup" ||
    raw === "manual" ||
    raw === "scan" ||
    raw === "historical"
  ) {
    return raw
  }

  return "manual"
}

function normalizePurchase(raw: any): Purchase {
  const normalizedItems: PurchaseItem[] = Array.isArray(raw.items)
    ? raw.items.map((item: any) => ({
        id: item.id ?? crypto.randomUUID(),
        productName: item.productName ?? "",
        category: item.category ?? "",
        grams: Number(item.grams ?? 0),
      }))
    : [
        {
          id: crypto.randomUUID(),
          productName: raw.productName ?? "",
          category: raw.category ?? "",
          grams: Number(raw.grams ?? 0),
        },
      ]

  return {
    id: raw.id ?? crypto.randomUUID(),
    purchaseDate: raw.purchaseDate ?? "",
    dispensary: raw.dispensary ?? "",
    notes: raw.notes ?? "",
    source: raw.source ?? "manual",
    items: normalizedItems,
    countsTowardAllotment:
      typeof raw.countsTowardAllotment === "boolean"
        ? raw.countsTowardAllotment
        : true,
    entryMode: normalizeEntryMode(raw.entryMode ?? raw.source),
  }
}

function loadPurchases(username: string): Purchase[] {
  const saved = localStorage.getItem(getPurchaseStorageKey(username))
  const parsed = saved ? JSON.parse(saved) : []
  return Array.isArray(parsed) ? parsed.map(normalizePurchase) : []
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
    savePurchases(currentUser, userPurchases)
    set({ purchases: userPurchases })
  },

  addPurchase: (purchase) => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) return

    const normalizedPurchase = normalizePurchase(purchase)
    const updatedPurchases = [normalizedPurchase, ...get().purchases]

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