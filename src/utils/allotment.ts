import type { Purchase } from "../features/purchases/purchaseStore"

const ALLOTMENT_LIMIT = 84.03
const WINDOW_DAYS = 30
const MS_PER_DAY = 1000 * 60 * 60 * 24

type PurchaseDateFields = Pick<
  Purchase,
  "purchaseDate" | "purchaseTime" | "purchaseDateTime"
>

function buildPurchaseDateTime(purchase: PurchaseDateFields) {
  const safeDateTime = String(purchase.purchaseDateTime ?? "").trim()
  if (safeDateTime) return safeDateTime

  const safeDate = String(purchase.purchaseDate ?? "").trim()
  const safeTime = String(purchase.purchaseTime ?? "").trim() || "12:00"

  if (!safeDate) return ""
  return `${safeDate}T${safeTime}`
}

function parsePurchaseDateTime(purchase: PurchaseDateFields) {
  const resolved = buildPurchaseDateTime(purchase)
  return resolved ? new Date(resolved) : new Date("")
}

function roundToTwo(num: number) {
  return Math.round(num * 100) / 100
}

function getPurchaseItems(purchase: Purchase) {
  return Array.isArray(purchase.items) ? purchase.items : []
}

function getPurchaseTotalGrams(purchase: Purchase) {
  return roundToTwo(
    getPurchaseItems(purchase).reduce(
      (total, item) => total + Number(item.grams || 0),
      0
    )
  )
}

function getRollOffDateTime(purchase: Purchase) {
  const purchaseDateTime = parsePurchaseDateTime(purchase)
  const rollOffDateTime = new Date(purchaseDateTime)

  rollOffDateTime.setTime(
    rollOffDateTime.getTime() + WINDOW_DAYS * MS_PER_DAY
  )

  return rollOffDateTime
}

function getDaysUntil(from: Date, to: Date) {
  return Math.max(Math.ceil((to.getTime() - from.getTime()) / MS_PER_DAY), 0)
}

export function getActivePurchases(purchases: Purchase[]) {
  const now = new Date()

  return purchases.filter((purchase) => {
    const purchaseDateTime = parsePurchaseDateTime(purchase)
    if (Number.isNaN(purchaseDateTime.getTime())) return false

    const rollOffDateTime = getRollOffDateTime(purchase)

    return (
      purchaseDateTime.getTime() <= now.getTime() &&
      now.getTime() < rollOffDateTime.getTime()
    )
  })
}

export function getUsedGrams(purchases: Purchase[]) {
  return roundToTwo(
    getActivePurchases(purchases).reduce(
      (total, purchase) => total + getPurchaseTotalGrams(purchase),
      0
    )
  )
}

export function getRemainingGrams(purchases: Purchase[]) {
  const used = getUsedGrams(purchases)
  return roundToTwo(Math.max(ALLOTMENT_LIMIT - used, 0))
}

export function getUpcomingRollOffs(purchases: Purchase[]) {
  return getActivePurchases(purchases)
    .map((purchase) => {
      const rollOffDateTime = getRollOffDateTime(purchase)

      return {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        purchaseTime: purchase.purchaseTime,
        purchaseDateTime: buildPurchaseDateTime(purchase),
        dispensary: purchase.dispensary,
        items: getPurchaseItems(purchase),
        grams: getPurchaseTotalGrams(purchase),
        rollOffDate: rollOffDateTime.toISOString().split("T")[0],
        rollOffTime: rollOffDateTime.toTimeString().slice(0, 5),
        rollOffDateTime: rollOffDateTime.toISOString(),
      }
    })
    .sort((a, b) => a.rollOffDateTime.localeCompare(b.rollOffDateTime))
}

export function getRecentPurchases(purchases: Purchase[], count = 3) {
  return [...purchases]
    .sort((a, b) => {
      const aTime = parsePurchaseDateTime(a).getTime()
      const bTime = parsePurchaseDateTime(b).getTime()
      return bTime - aTime
    })
    .slice(0, count)
    .map((purchase) => ({
      ...purchase,
      items: getPurchaseItems(purchase),
      grams: getPurchaseTotalGrams(purchase),
    }))
}

export function getTimelineEntries(purchases: Purchase[]) {
  const now = new Date()

  return getActivePurchases(purchases)
    .map((purchase) => {
      const rollOffDateTime = getRollOffDateTime(purchase)
      const daysUntilRollOff = getDaysUntil(now, rollOffDateTime)

      return {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        purchaseTime: purchase.purchaseTime,
        purchaseDateTime: buildPurchaseDateTime(purchase),
        dispensary: purchase.dispensary,
        items: getPurchaseItems(purchase),
        grams: getPurchaseTotalGrams(purchase),
        rollOffDate: rollOffDateTime.toISOString().split("T")[0],
        rollOffTime: rollOffDateTime.toTimeString().slice(0, 5),
        rollOffDateTime: rollOffDateTime.toISOString(),
        daysUntilRollOff,
        status: "Active Window",
      }
    })
    .sort((a, b) => a.rollOffDateTime.localeCompare(b.rollOffDateTime))
}

export function getPlannerData(purchases: Purchase[]) {
  const remainingNow = getRemainingGrams(purchases)
  const upcomingRollOffs = getUpcomingRollOffs(purchases)

  const nextReturn = upcomingRollOffs.length > 0 ? upcomingRollOffs[0] : null
  const nextTwoReturns = upcomingRollOffs.slice(0, 2)

  const projectedGainSoon = roundToTwo(
    nextTwoReturns.reduce((total, item) => total + item.grams, 0)
  )

  return {
    safeToBuyNow: remainingNow,
    nextReturnDate: nextReturn ? nextReturn.rollOffDate : "None scheduled",
    nextReturnTime: nextReturn ? nextReturn.rollOffTime : "Not scheduled",
    nextReturnAmount: nextReturn ? nextReturn.grams : 0,
    projectedGainSoon,
    upcomingRollOffs,
  }
}