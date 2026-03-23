export type DraftItem = {
  id: string
  productName: string
  category: string
  grams: string
}

export function createEmptyItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    productName: "",
    category: "",
    grams: "",
  }
}

export function getItemSummary(item: DraftItem) {
  const parts: string[] = []

  if (item.productName.trim()) parts.push(item.productName.trim())
  if (item.category.trim()) parts.push(item.category.trim())
  if (item.grams.trim()) parts.push(`${item.grams}g`)

  return parts.length > 0 ? parts.join(" • ") : "Tap to add details"
}