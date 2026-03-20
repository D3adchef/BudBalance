import { create } from "zustand"
import { supabase } from "../../lib/supabase"
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
  isLoading: boolean
  loadPurchasesForCurrentUser: () => Promise<void>
  addPurchase: (purchase: Purchase) => Promise<void>
  clearPurchases: () => Promise<void>
}

type PurchaseRow = {
  id: string
  user_id: string
  purchase_date: string
  purchase_time: string
  purchase_datetime: string
  dispensary: string | null
  notes: string | null
  source: string | null
  counts_toward_allotment: boolean
  entry_mode: string
  items: unknown
  created_at: string
  updated_at: string
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
        id: item?.id ?? crypto.randomUUID(),
        productName: String(item?.productName ?? "").trim(),
        category: String(item?.category ?? "").trim(),
        grams: Number(item?.grams ?? 0),
      }))
    : []

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
    dispensary: String(raw.dispensary ?? "").trim(),
    notes: String(raw.notes ?? "").trim(),
    source: String(raw.source ?? "manual").trim(),
    items: normalizedItems,
    countsTowardAllotment:
      typeof raw.countsTowardAllotment === "boolean"
        ? raw.countsTowardAllotment
        : true,
    entryMode: normalizeEntryMode(raw.entryMode ?? raw.source),
  }
}

function mapRowToPurchase(row: PurchaseRow): Purchase {
  const items = Array.isArray(row.items)
    ? row.items.map((item: any) => ({
        id: item?.id ?? crypto.randomUUID(),
        productName: String(item?.productName ?? "").trim(),
        category: String(item?.category ?? "").trim(),
        grams: Number(item?.grams ?? 0),
      }))
    : []

  return {
    id: row.id,
    purchaseDate: row.purchase_date,
    purchaseTime: row.purchase_time,
    purchaseDateTime: row.purchase_datetime,
    dispensary: row.dispensary ?? "",
    notes: row.notes ?? "",
    source: row.source ?? "manual",
    items,
    countsTowardAllotment: row.counts_toward_allotment,
    entryMode: normalizeEntryMode(row.entry_mode),
  }
}

function mapPurchaseToInsertRow(userId: string, purchase: Purchase) {
  return {
    id: purchase.id,
    user_id: userId,
    purchase_date: purchase.purchaseDate,
    purchase_time: purchase.purchaseTime,
    purchase_datetime: purchase.purchaseDateTime,
    dispensary: purchase.dispensary || null,
    notes: purchase.notes || null,
    source: purchase.source || "manual",
    counts_toward_allotment: purchase.countsTowardAllotment,
    entry_mode: purchase.entryMode,
    items: purchase.items,
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

export const usePurchaseStore = create<PurchaseStore>((set, get) => ({
  purchases: [],
  isLoading: false,

  loadPurchasesForCurrentUser: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ purchases: [], isLoading: false })
      return
    }

    set({ isLoading: true })

    const { data, error } = await supabase
      .from("purchases")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("purchase_datetime", { ascending: false })

    if (error) {
      console.error("Failed to load purchases:", error)
      set({ purchases: [], isLoading: false })
      return
    }

    const normalized = Array.isArray(data)
      ? data.map((row) => mapRowToPurchase(row as PurchaseRow))
      : []

    set({
      purchases: sortPurchasesNewestFirst(normalized),
      isLoading: false,
    })
  },

  addPurchase: async (purchase) => {
    const currentUser = useAuthStore.getState().currentUser
    if (!currentUser) return

    const normalizedPurchase = normalizePurchase(purchase)

    const { error } = await supabase
      .from("purchases")
      .insert(mapPurchaseToInsertRow(currentUser.id, normalizedPurchase))

    if (error) {
      console.error("Failed to add purchase:", error)
      throw new Error(error.message)
    }

    set({
      purchases: sortPurchasesNewestFirst([
        normalizedPurchase,
        ...get().purchases,
      ]),
    })
  },

  clearPurchases: async () => {
    const currentUser = useAuthStore.getState().currentUser

    if (!currentUser) {
      set({ purchases: [] })
      return
    }

    const { error } = await supabase
      .from("purchases")
      .delete()
      .eq("user_id", currentUser.id)

    if (error) {
      console.error("Failed to clear purchases:", error)
      throw new Error(error.message)
    }

    set({ purchases: [] })
  },
}))