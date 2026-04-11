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
  const name = item.productName.trim()
  const category = item.category.trim()
  const grams = item.grams.trim()

  const parts: string[] = []

  if (name) parts.push(name)
  if (category) parts.push(category)
  if (grams) parts.push(`${grams}g`)

  return parts.length ? parts.join(" • ") : "Tap to add details"
}