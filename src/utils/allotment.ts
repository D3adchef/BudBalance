import type { Purchase } from "../features/purchases/purchaseStore"

const ALLOTMENT_LIMIT = 84.03
const WINDOW_DAYS = 31

function parseDate(dateString: string) {
  return new Date(`${dateString}T00:00:00`)
}

function differenceInDays(from: Date, to: Date) {
  const msPerDay = 1000 * 60 * 60 * 24
  return Math.floor((to.getTime() - from.getTime()) / msPerDay)
}

function roundToTwo(num: number) {
  return Math.round(num * 100) / 100
}

function getPurchaseTotalGrams(purchase: Purchase) {
  const items = Array.isArray(purchase.items) ? purchase.items : []
  return roundToTwo(
    items.reduce((total, item) => total + Number(item.grams || 0), 0)
  )
}

export function getActivePurchases(purchases: Purchase[]) {
  const today = new Date()

  return purchases.filter((purchase) => {
    const purchaseDate = parseDate(purchase.purchaseDate)
    const ageInDays = differenceInDays(purchaseDate, today)
    return ageInDays >= 0 && ageInDays < WINDOW_DAYS
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
      const purchaseDate = parseDate(purchase.purchaseDate)
      const rollOffDate = new Date(purchaseDate)
      rollOffDate.setDate(rollOffDate.getDate() + WINDOW_DAYS)

      return {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        dispensary: purchase.dispensary,
        items: Array.isArray(purchase.items) ? purchase.items : [],
        grams: getPurchaseTotalGrams(purchase),
        rollOffDate: rollOffDate.toISOString().split("T")[0],
      }
    })
    .sort((a, b) => a.rollOffDate.localeCompare(b.rollOffDate))
}

export function getRecentPurchases(purchases: Purchase[], count = 3) {
  return [...purchases]
    .sort((a, b) => b.purchaseDate.localeCompare(a.purchaseDate))
    .slice(0, count)
    .map((purchase) => ({
      ...purchase,
      items: Array.isArray(purchase.items) ? purchase.items : [],
      grams: getPurchaseTotalGrams(purchase),
    }))
}

export function getTimelineEntries(purchases: Purchase[]) {
  const today = new Date()

  return getActivePurchases(purchases)
    .map((purchase) => {
      const purchaseDate = parseDate(purchase.purchaseDate)
      const rollOffDate = new Date(purchaseDate)
      rollOffDate.setDate(rollOffDate.getDate() + WINDOW_DAYS)

      const daysUntilRollOff = Math.max(
        differenceInDays(today, rollOffDate),
        0
      )

      return {
        id: purchase.id,
        purchaseDate: purchase.purchaseDate,
        dispensary: purchase.dispensary,
        items: Array.isArray(purchase.items) ? purchase.items : [],
        grams: getPurchaseTotalGrams(purchase),
        rollOffDate: rollOffDate.toISOString().split("T")[0],
        daysUntilRollOff,
        status: "Active Window",
      }
    })
    .sort((a, b) => a.rollOffDate.localeCompare(b.rollOffDate))
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
    nextReturnAmount: nextReturn ? nextReturn.grams : 0,
    projectedGainSoon,
    upcomingRollOffs,
  }
}