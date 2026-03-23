import { createEmptyItem, type DraftItem } from "./purchaseItemHelpers"
import {
  CONCENTRATE_KEYWORDS,
  DATE_PATTERN,
  DISPENSARY_BLACKLIST_WORDS,
  EDIBLE_KEYWORDS,
  FLOWER_KEYWORDS,
  GRAMS_INLINE_LEADING_PATTERN,
  GRAMS_INLINE_TRAILING_PATTERN,
  GRAMS_ONLY_PATTERN,
  MG_PATTERN,
  PHONE_PATTERN,
  PRE_ROLL_KEYWORDS,
  PRODUCT_NAME_NOISE_WORDS,
  RECEIPT_JUNK_WORDS,
  TIME_PATTERN,
  VAPE_KEYWORDS,
} from "./receiptKeywords"

export type { DraftItem } from "./purchaseItemHelpers"
export { createEmptyItem } from "./purchaseItemHelpers"

export type ParsedReceipt = {
  dispensary: string
  purchaseDate: string
  purchaseTime: string
  items: DraftItem[]
  rawText: string
}

export type ScanConfidence = "high" | "medium" | "low"

export type ScanValidationResult = {
  confidence: ScanConfidence
  warnings: string[]
  missingFields: string[]
  detectedFields: {
    dispensary: boolean
    purchaseDate: boolean
    purchaseTime: boolean
    items: boolean
  }
}

export function normalizeDateForInput(value: string) {
  const slashMatch = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0")
    const day = slashMatch[2].padStart(2, "0")
    const year =
      slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]

    return `${year}-${month}-${day}`
  }

  const dashMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dashMatch) {
    const year = dashMatch[1]
    const month = dashMatch[2].padStart(2, "0")
    const day = dashMatch[3].padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  return ""
}

export function normalizeTimeForInput(value: string) {
  const trimmed = value.trim().toLowerCase()

  const amPmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i)
  if (amPmMatch) {
    let hour = Number(amPmMatch[1])
    const minute = amPmMatch[2]
    const meridiem = amPmMatch[3].toLowerCase()

    if (meridiem === "pm" && hour !== 12) hour += 12
    if (meridiem === "am" && hour === 12) hour = 0

    return `${String(hour).padStart(2, "0")}:${minute}`
  }

  const twentyFourHourMatch = trimmed.match(/^(\d{1,2}):(\d{2})$/)
  if (twentyFourHourMatch) {
    const hour = Number(twentyFourHourMatch[1])
    const minute = Number(twentyFourHourMatch[2])

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    }
  }

  return ""
}

export function convertTo24HourTime(
  hour: string,
  minute: string,
  period: string
) {
  if (!hour || !minute || !period) return ""

  let numericHour = Number(hour)

  if (Number.isNaN(numericHour)) return ""

  if (period === "AM") {
    if (numericHour === 12) numericHour = 0
  } else {
    if (numericHour !== 12) numericHour += 12
  }

  return `${String(numericHour).padStart(2, "0")}:${minute}`
}

export function getTimePartsFrom24Hour(value: string) {
  if (!value) {
    return {
      hour: "",
      minute: "",
      period: "AM",
    }
  }

  const [rawHour = "", rawMinute = "00"] = value.split(":")
  const hourNumber = Number(rawHour)

  if (Number.isNaN(hourNumber)) {
    return {
      hour: "",
      minute: "",
      period: "AM",
    }
  }

  const period = hourNumber >= 12 ? "PM" : "AM"
  const displayHour = hourNumber % 12 === 0 ? 12 : hourNumber % 12

  return {
    hour: String(displayHour),
    minute: String(rawMinute).padStart(2, "0"),
    period,
  }
}

export function buildPurchaseDateTime(
  purchaseDate: string,
  purchaseTime: string
) {
  return `${purchaseDate}T${purchaseTime}`
}

export function createLocalDateTime(dateString: string, timeString: string) {
  return new Date(`${dateString}T${timeString || "00:00"}:00`)
}

export function guessCategory(productName: string) {
  const name = productName.toLowerCase()

  if (PRE_ROLL_KEYWORDS.some((keyword: string) => name.includes(keyword))) {
    return "pre-roll"
  }

  if (
    EDIBLE_KEYWORDS.some((keyword: string) => name.includes(keyword)) ||
    MG_PATTERN.test(name)
  ) {
    return "edible"
  }

  if (VAPE_KEYWORDS.some((keyword: string) => name.includes(keyword))) {
    return "vape"
  }

  if (CONCENTRATE_KEYWORDS.some((keyword: string) => name.includes(keyword))) {
    return "concentrate"
  }

  if (FLOWER_KEYWORDS.some((keyword: string) => name.includes(keyword))) {
    return "flower"
  }

  return "flower"
}

export function sanitizeScannedProductName(value: string) {
  let cleaned = value
    .replace(/\$?\d+(\.\d{2})?/g, "")
    .replace(/[^\w\s#&/().-]/g, " ")

  for (const word of PRODUCT_NAME_NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), "")
  }

  cleaned = cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/[-•|]+/g, " ")
    .trim()

  return cleaned
}

export function looksLikeReceiptJunk(line: string) {
  const lower = line.toLowerCase()
  return RECEIPT_JUNK_WORDS.some((word) => lower.includes(word))
}

export function looksLikeAddressLine(line: string) {
  return /\d{1,5}\s+[a-z0-9].*/i.test(line) && line.length < 50
}

export function extractItemsFromLines(lines: string[]) {
  const parsedItems: DraftItem[] = []
  const seen = new Set<string>()

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = lines[index]
    const nextLine = lines[index + 1] || ""

    if (looksLikeReceiptJunk(currentLine)) continue

    const inlineTrailingMatch = currentLine.match(GRAMS_INLINE_TRAILING_PATTERN)
    const inlineLeadingMatch = currentLine.match(GRAMS_INLINE_LEADING_PATTERN)

    let grams = ""
    let productName = ""

    if (inlineTrailingMatch) {
      productName = sanitizeScannedProductName(inlineTrailingMatch[1] || "")
      grams = inlineTrailingMatch[2] || ""
    } else if (inlineLeadingMatch) {
      grams = inlineLeadingMatch[1] || ""
      productName = sanitizeScannedProductName(inlineLeadingMatch[2] || "")
    } else {
      const nextLineGramsMatch = nextLine.match(GRAMS_ONLY_PATTERN)
      const currentLineLooksLikeName =
        /[a-z]/i.test(currentLine) &&
        !looksLikeReceiptJunk(currentLine) &&
        !looksLikeAddressLine(currentLine) &&
        !/\b(am|pm)\b/i.test(currentLine) &&
        !DATE_PATTERN.test(currentLine)

      if (currentLineLooksLikeName && nextLineGramsMatch) {
        productName = sanitizeScannedProductName(currentLine)
        grams = nextLineGramsMatch[1] || ""
        index += 1
      }
    }

    if (!grams) continue

    const numericGrams = Number(grams)
    if (Number.isNaN(numericGrams) || numericGrams <= 0) continue

    const resolvedName = productName || "Scanned Item"
    const key = `${resolvedName.toLowerCase()}|${grams}`

    if (seen.has(key)) continue
    seen.add(key)

    parsedItems.push({
      id: crypto.randomUUID(),
      productName: resolvedName,
      category: guessCategory(resolvedName),
      grams,
    })
  }

  return parsedItems
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const rawLines = rawText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const lines = rawLines.filter((line) => line.length >= 2)

  const foundDate =
    lines.find((line) => DATE_PATTERN.test(line))?.match(DATE_PATTERN)?.[0] || ""

  const foundTime =
    lines.find((line) => TIME_PATTERN.test(line))?.match(TIME_PATTERN)?.[0] || ""

  const normalizedDate = normalizeDateForInput(foundDate)
  const normalizedTime = normalizeTimeForInput(foundTime)

  const likelyHeaderLines = lines.slice(0, 8)

  const dispensary =
    likelyHeaderLines.find((line) => {
      const lower = line.toLowerCase()

      if (lower.length < 3) return false
      if (DATE_PATTERN.test(lower)) return false
      if (TIME_PATTERN.test(lower)) return false
      if (PHONE_PATTERN.test(lower)) return false
      if (looksLikeAddressLine(lower)) return false
      if (DISPENSARY_BLACKLIST_WORDS.some((term) => lower.includes(term))) {
        return false
      }

      return /[a-z]/i.test(lower)
    }) || ""

  const parsedItems = extractItemsFromLines(lines)

  return {
    dispensary,
    purchaseDate: normalizedDate,
    purchaseTime: normalizedTime,
    items: parsedItems.length > 0 ? parsedItems : [createEmptyItem()],
    rawText,
  }
}

export function isFuturePurchase(purchaseDate: string, purchaseTime: string) {
  if (!purchaseDate) return false

  const resolved = new Date(`${purchaseDate}T${purchaseTime || "00:00"}:00`)
  if (Number.isNaN(resolved.getTime())) return false

  return resolved.getTime() > Date.now()
}

export function validateParsedReceipt(
  parsed: ParsedReceipt
): ScanValidationResult {
  const warnings: string[] = []
  const missingFields: string[] = []

  const validItems = parsed.items.filter((item) => {
    const gramsValue = Number(item.grams)

    return (
      item.productName.trim().length > 0 &&
      item.category.trim().length > 0 &&
      item.grams.trim().length > 0 &&
      !Number.isNaN(gramsValue) &&
      gramsValue > 0
    )
  })

  const detectedFields = {
    dispensary: Boolean(parsed.dispensary.trim()),
    purchaseDate: Boolean(parsed.purchaseDate),
    purchaseTime: Boolean(parsed.purchaseTime),
    items: validItems.length > 0,
  }

  if (!detectedFields.dispensary) missingFields.push("Dispensary")
  if (!detectedFields.purchaseDate) missingFields.push("Purchase Date")
  if (!detectedFields.purchaseTime) missingFields.push("Purchase Time")
  if (!detectedFields.items) missingFields.push("Items")

  if (
    parsed.purchaseDate &&
    isFuturePurchase(parsed.purchaseDate, parsed.purchaseTime)
  ) {
    warnings.push("Purchase date/time appears to be in the future.")
  }

  const suspiciousItems = parsed.items.filter((item) => {
    const gramsValue = Number(item.grams)
    return !Number.isNaN(gramsValue) && gramsValue > 28
  })

  if (suspiciousItems.length > 0) {
    warnings.push("One or more scanned items have unusually large gram amounts.")
  }

  const unnamedItems = parsed.items.filter((item) => {
    const trimmedName = item.productName.trim().toLowerCase()
    return trimmedName === "" || trimmedName === "scanned item"
  })

  if (unnamedItems.length > 0) {
    warnings.push("Some item names were unclear and may need manual review.")
  }

  const duplicateKeys = new Set<string>()
  const duplicateItems = parsed.items.filter((item) => {
    const key = `${item.productName.trim().toLowerCase()}|${item.grams.trim()}`

    if (!item.productName.trim() || !item.grams.trim()) return false
    if (duplicateKeys.has(key)) return true

    duplicateKeys.add(key)
    return false
  })

  if (duplicateItems.length > 0) {
    warnings.push("Possible duplicate items were detected from OCR noise.")
  }

  if (
    !detectedFields.dispensary &&
    !detectedFields.purchaseDate &&
    !detectedFields.items
  ) {
    warnings.push("This image does not strongly resemble a readable receipt.")
  }

  let confidence: ScanConfidence = "high"

  if (missingFields.length >= 2 || warnings.length >= 3) {
    confidence = "low"
  } else if (missingFields.length >= 1 || warnings.length >= 1) {
    confidence = "medium"
  }

  return {
    confidence,
    warnings,
    missingFields,
    detectedFields,
  }
}

export function getValidationCardClasses(confidence: ScanConfidence) {
  if (confidence === "high") {
    return "border-emerald-500/20 bg-emerald-500/10 text-emerald-100"
  }

  if (confidence === "medium") {
    return "border-amber-500/20 bg-amber-500/10 text-amber-100"
  }

  return "border-red-500/20 bg-red-500/10 text-red-100"
}

export function getValidationTitle(confidence: ScanConfidence) {
  if (confidence === "high") return "Receipt looks good"
  if (confidence === "medium") return "Some fields need review"
  return "Low-confidence scan"
}

export function getValidationDescription(validation: ScanValidationResult) {
  if (validation.confidence === "high") {
    return "Key receipt fields were detected. Please review everything before saving."
  }

  if (validation.confidence === "medium") {
    return "BudBalance found useful information, but a few fields may need manual cleanup."
  }

  return "This scan may not be reliable. Double-check the purchase details and item list carefully."
}