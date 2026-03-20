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
  purchaseTime: string
  purchaseDateTime: string
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

function getCurrentUserStorageKey(currentUser: unknown) {
  if (!currentUser) return null

  if (typeof currentUser === "string") {
    return currentUser.toLowerCase()
  }

  if (
    typeof currentUser === "object" &&
    currentUser !== null &&
    "id" in currentUser &&
    typeof currentUser.id === "string"
  ) {
    return currentUser.id.toLowerCase()
  }

  return null
}

function getPurchaseStorageKey(userKey: string) {
  return `budbalance-purchases-${userKey}`
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

function buildPurchaseDateTime(purchaseDate: string, purchaseTime: string) {
  const safeDate = String(purchaseDate ?? "").trim()
  const safeTime = String(purchaseTime ?? "").trim() || "12:00"

  if (!safeDate) return ""
  return `${safeDate}T${safeTime}`
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

  const purchaseDate = String(raw.purchaseDate ?? "").trim()
  const purchaseTime = String(raw.purchaseTime ?? "").trim() || "12:00"
  const purchaseDateTime =
    String(raw.purchaseDateTime ?? "").trim() ||
    buildPurchaseDateTime(purchaseDate, purchaseTime)

  return {
    id: raw.id ?? crypto.randomUUID(),
    purchaseDate,
    purchaseTime,
    purchaseDateTime,
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

function sortPurchasesNewestFirst(purchases: Purchase[]) {
  return [...purchases].sort((a, b) => {
    const aTime = new Date(
      a.purchaseDateTime || buildPurchaseDateTime(a.purchaseDate, a.purchaseTime)
    ).getTime()
    const bTime = new Date(
      b.purchaseDateTime || buildPurchaseDateTime(b.purchaseDate, b.purchaseTime)
    ).getTime()

    return bTime - aTime
  })
}

export function getPurchasesOldestFirst(purchases: Purchase[]) {
  return [...purchases].sort((a, b) => {
    const aTime = new Date(
      a.purchaseDateTime || buildPurchaseDateTime(a.purchaseDate, a.purchaseTime)
    ).getTime()
    const bTime = new Date(
      b.purchaseDateTime || buildPurchaseDateTime(b.purchaseDate, b.purchaseTime)
    ).getTime()

    return aTime - bTime
  })
}

function loadPurchases(userKey: string): Purchase[] {
  const saved = localStorage.getItem(getPurchaseStorageKey(userKey))
  const parsed = saved ? JSON.parse(saved) : []
  const normalized = Array.isArray(parsed) ? parsed.map(normalizePurchase) : []
  return sortPurchasesNewestFirst(normalized)
}

function savePurchases(userKey: string, purchases: Purchase[]) {
  localStorage.setItem(
    getPurchaseStorageKey(userKey),
    JSON.stringify(sortPurchasesNewestFirst(purchases))
  )
}

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  purchases: [],

  loadPurchasesForCurrentUser: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ purchases: [] })
      return
    }

    const userPurchases = loadPurchases(userKey)
    savePurchases(userKey, userPurchases)
    set({ purchases: userPurchases })
  },

  addPurchase: (purchase) => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) return

    const normalizedPurchase = normalizePurchase(purchase)
    const updatedPurchases = sortPurchasesNewestFirst([
      normalizedPurchase,
      ...get().purchases,
    ])

    savePurchases(userKey, updatedPurchases)
    set({ purchases: updatedPurchases })
  },

  clearPurchases: () => {
    const currentUser = useAuthStore.getState().currentUser
    const userKey = getCurrentUserStorageKey(currentUser)

    if (!userKey) {
      set({ purchases: [] })
      return
    }

    savePurchases(userKey, [])
    set({ purchases: [] })
  },
}))