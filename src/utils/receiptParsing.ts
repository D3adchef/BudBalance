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
  MISSISSIPPI_DISPENSARIES,
  PHONE_PATTERN,
  PRE_ROLL_KEYWORDS,
  PRODUCT_NAME_NOISE_WORDS,
  RECEIPT_JUNK_WORDS,
  TIME_PATTERN,
  VAPE_KEYWORDS,
  normalizeDispensaryName,
} from "./receiptKeywords"

export type { DraftItem } from "./purchaseItemHelpers"
export { createEmptyItem } from "./purchaseItemHelpers"

export type ParsedReceipt = {
  dispensary: string
  purchaseDate: string
  purchaseTime: string
  items: DraftItem[]
  rawText: string
  dispensaryConfidence: "high" | "medium" | "low"
  dispensaryPoints: number
  dispensaryMatchedBy: string[]
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
  points: number
}

const MONTH_NAME_DATE_PATTERN =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i

const TIME_WITH_OPTIONAL_SECONDS_PATTERN =
  /\b(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM|am|pm)?|\d{1,2}:\d{2})\b/

const TOTAL_GRAMS_PATTERN =
  /\btotal\s+grams?\s*[:\-]?\s*(\d*\.?\d+)\b/i

const PAREN_GRAMS_PATTERN =
  /\((\d*\.?\d+)\s?g\)/i

const LOOSE_GRAMS_PATTERN =
  /(\d*\.?\d+)\s?g\b/i

type DispensaryMatch = {
  name: string
  normalizedName: string
  points: number
  confidence: "high" | "medium" | "low"
  matchedBy: string[]
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

export function normalizeDateForInput(value: string) {
  const trimmed = normalizeWhitespace(value)

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0")
    const day = slashMatch[2].padStart(2, "0")
    const year =
      slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3]

    return `${year}-${month}-${day}`
  }

  const dashMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dashMatch) {
    const year = dashMatch[1]
    const month = dashMatch[2].padStart(2, "0")
    const day = dashMatch[3].padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const parsedMonthDate = new Date(trimmed)
  if (!Number.isNaN(parsedMonthDate.getTime())) {
    const year = parsedMonthDate.getFullYear()
    const month = String(parsedMonthDate.getMonth() + 1).padStart(2, "0")
    const day = String(parsedMonthDate.getDate()).padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  return ""
}

export function normalizeTimeForInput(value: string) {
  const trimmed = normalizeWhitespace(value)

  const amPmWithSecondsMatch = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?\s*(am|pm)$/i
  )
  if (amPmWithSecondsMatch) {
    let hour = Number(amPmWithSecondsMatch[1])
    const minute = amPmWithSecondsMatch[2]
    const meridiem = amPmWithSecondsMatch[3].toLowerCase()

    if (meridiem === "pm" && hour !== 12) hour += 12
    if (meridiem === "am" && hour === 12) hour = 0

    return `${String(hour).padStart(2, "0")}:${minute}`
  }

  const twentyFourHourWithSecondsMatch = trimmed.match(
    /^(\d{1,2}):(\d{2})(?::\d{2})?$/
  )
  if (twentyFourHourWithSecondsMatch) {
    const hour = Number(twentyFourHourWithSecondsMatch[1])
    const minute = Number(twentyFourHourWithSecondsMatch[2])

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    }
  }

  const weirdTwentyFourHourPlusMeridiem = trimmed.match(
    /^(\d{1,2}):(\d{2})\s*(am|pm)$/i
  )
  if (weirdTwentyFourHourPlusMeridiem) {
    const hour = Number(weirdTwentyFourHourPlusMeridiem[1])
    const minute = Number(weirdTwentyFourHourPlusMeridiem[2])

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

  if (PRE_ROLL_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "pre-roll"
  }

  if (
    EDIBLE_KEYWORDS.some((keyword) => name.includes(keyword)) ||
    MG_PATTERN.test(name)
  ) {
    return "edible"
  }

  if (VAPE_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "vape"
  }

  if (CONCENTRATE_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "concentrate"
  }

  if (FLOWER_KEYWORDS.some((keyword) => name.includes(keyword))) {
    return "flower"
  }

  return "flower"
}

export function sanitizeScannedProductName(value: string) {
  let cleaned = value
    .replace(/\$?\d+(\.\d{2})?/g, "")
    .replace(/[|]+/g, " ")
    .replace(/[^\w\s#&/().,-]/g, " ")

  for (const word of PRODUCT_NAME_NOISE_WORDS) {
    cleaned = cleaned.replace(new RegExp(`\\b${word}\\b`, "gi"), "")
  }

  cleaned = cleaned
    .replace(/\s{2,}/g, " ")
    .replace(/[-•]+/g, " ")
    .replace(/\(\s*\)/g, "")
    .trim()

  return cleaned
}

export function looksLikeReceiptJunk(line: string) {
  const lower = line.toLowerCase()
  return RECEIPT_JUNK_WORDS.some((word) => lower.includes(word))
}

export function looksLikeAddressLine(line: string) {
  return /\d{1,5}\s+[a-z0-9].*/i.test(line) && line.length < 60
}

function extractDateAndTime(lines: string[], rawText: string) {
  let normalizedDate = ""
  let normalizedTime = ""

  for (const line of lines) {
    const monthNameDateMatch = line.match(MONTH_NAME_DATE_PATTERN)
    if (!normalizedDate && monthNameDateMatch?.[0]) {
      normalizedDate = normalizeDateForInput(monthNameDateMatch[0])
    }

    const numericDateMatch = line.match(DATE_PATTERN)
    if (!normalizedDate && numericDateMatch?.[0]) {
      normalizedDate = normalizeDateForInput(numericDateMatch[0])
    }

    const timeMatch = line.match(TIME_WITH_OPTIONAL_SECONDS_PATTERN)
    if (!normalizedTime && timeMatch?.[0]) {
      normalizedTime = normalizeTimeForInput(timeMatch[0])
    }

    if (normalizedDate && normalizedTime) break
  }

  if (!normalizedDate) {
    const monthDateFromRaw = rawText.match(MONTH_NAME_DATE_PATTERN)
    if (monthDateFromRaw?.[0]) {
      normalizedDate = normalizeDateForInput(monthDateFromRaw[0])
    }
  }

  if (!normalizedDate) {
    const numericDateFromRaw = rawText.match(DATE_PATTERN)
    if (numericDateFromRaw?.[0]) {
      normalizedDate = normalizeDateForInput(numericDateFromRaw[0])
    }
  }

  if (!normalizedTime) {
    const timeFromRaw = rawText.match(TIME_WITH_OPTIONAL_SECONDS_PATTERN)
    if (timeFromRaw?.[0]) {
      normalizedTime = normalizeTimeForInput(timeFromRaw[0])
    }
  }

  return {
    purchaseDate: normalizedDate,
    purchaseTime: normalizedTime,
  }
}

function getConfidenceFromPoints(points: number): "high" | "medium" | "low" {
  if (points >= 7) return "high"
  if (points >= 4) return "medium"
  return "low"
}

function tokenize(value: string) {
  return normalizeDispensaryName(value)
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length >= 2)
}

function getTokenOverlapScore(source: string, target: string) {
  const sourceTokens = new Set(tokenize(source))
  const targetTokens = new Set(tokenize(target))

  let overlap = 0
  for (const token of sourceTokens) {
    if (targetTokens.has(token)) overlap += 1
  }

  return overlap
}

function isBlacklistedDispensaryLine(line: string) {
  const normalized = normalizeDispensaryName(line)

  return DISPENSARY_BLACKLIST_WORDS.some((word) =>
    normalized.includes(normalizeDispensaryName(word))
  )
}

function scoreDispensaryCandidate(line: string, fullText: string) {
  const normalizedLine = normalizeDispensaryName(line)
  const normalizedText = normalizeDispensaryName(fullText)

  let bestMatch: DispensaryMatch | null = null

  for (const dispensary of MISSISSIPPI_DISPENSARIES) {
    let points = 0
    const matchedBy: string[] = []

    for (const alias of dispensary.aliases) {
      if (!alias) continue

      if (normalizedLine === alias) {
        points = Math.max(points, 8)
        if (!matchedBy.includes("exact-line-match")) {
          matchedBy.push("exact-line-match")
        }
      }

      if (normalizedText.includes(alias)) {
        points = Math.max(points, 6)
        if (!matchedBy.includes("text-alias-match")) {
          matchedBy.push("text-alias-match")
        }
      }

      if (normalizedLine.includes(alias) || alias.includes(normalizedLine)) {
        points = Math.max(points, 5)
        if (!matchedBy.includes("line-alias-overlap")) {
          matchedBy.push("line-alias-overlap")
        }
      }
    }

    const overlapWithLine = getTokenOverlapScore(
      normalizedLine,
      dispensary.normalizedName
    )
    if (overlapWithLine >= 2) {
      const overlapPoints = Math.min(4, overlapWithLine)
      if (overlapPoints > points) {
        points = overlapPoints
      }
      matchedBy.push(`token-overlap-line:${overlapWithLine}`)
    }

    const overlapWithText = getTokenOverlapScore(
      normalizedText,
      dispensary.normalizedName
    )
    if (overlapWithText >= 3) {
      const overlapPoints = Math.min(5, overlapWithText)
      if (overlapPoints > points) {
        points = overlapPoints
      }
      matchedBy.push(`token-overlap-text:${overlapWithText}`)
    }

    if (!bestMatch || points > bestMatch.points) {
      bestMatch = {
        name: dispensary.name,
        normalizedName: dispensary.normalizedName,
        points,
        confidence: getConfidenceFromPoints(points),
        matchedBy,
      }
    }
  }

  return bestMatch
}

function extractDispensary(lines: string[], rawText: string) {
  const likelyHeaderLines = lines.slice(0, 12)

  let bestMatch: DispensaryMatch | null = null

  for (const line of likelyHeaderLines) {
    const lower = line.toLowerCase()

    if (lower.length < 3) continue
    if (DATE_PATTERN.test(lower)) continue
    if (MONTH_NAME_DATE_PATTERN.test(lower)) continue
    if (TIME_PATTERN.test(lower)) continue
    if (TIME_WITH_OPTIONAL_SECONDS_PATTERN.test(lower)) continue
    if (PHONE_PATTERN.test(lower)) continue
    if (looksLikeAddressLine(lower)) continue
    if (isBlacklistedDispensaryLine(lower)) continue
    if (!/[a-z]/i.test(lower)) continue

    const candidate = scoreDispensaryCandidate(line, rawText)
    if (!candidate) continue

    if (!bestMatch || candidate.points > bestMatch.points) {
      bestMatch = candidate
    }
  }

  if (!bestMatch) {
    return {
      dispensary: "",
      dispensaryConfidence: "low" as const,
      dispensaryPoints: 0,
      dispensaryMatchedBy: [],
    }
  }

  return {
    dispensary: bestMatch.name,
    dispensaryConfidence: bestMatch.confidence,
    dispensaryPoints: bestMatch.points,
    dispensaryMatchedBy: bestMatch.matchedBy,
  }
}

function extractTotalGrams(lines: string[]) {
  for (const line of lines) {
    const match = line.match(TOTAL_GRAMS_PATTERN)
    if (match?.[1]) return match[1]
  }

  return ""
}

export function extractItemsFromLines(lines: string[]) {
  const parsedItems: DraftItem[] = []
  const seen = new Set<string>()

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = normalizeWhitespace(lines[index])
    const nextLine = normalizeWhitespace(lines[index + 1] || "")

    if (!currentLine || looksLikeReceiptJunk(currentLine)) continue
    if (TOTAL_GRAMS_PATTERN.test(currentLine)) continue

    const inlineTrailingMatch = currentLine.match(GRAMS_INLINE_TRAILING_PATTERN)
    const inlineLeadingMatch = currentLine.match(GRAMS_INLINE_LEADING_PATTERN)
    const parenGramsMatch = currentLine.match(PAREN_GRAMS_PATTERN)
    const looseGramsMatch = currentLine.match(LOOSE_GRAMS_PATTERN)

    let grams = ""
    let productName = ""

    if (inlineTrailingMatch) {
      productName = sanitizeScannedProductName(inlineTrailingMatch[1] || "")
      grams = inlineTrailingMatch[2] || ""
    } else if (inlineLeadingMatch) {
      grams = inlineLeadingMatch[1] || ""
      productName = sanitizeScannedProductName(inlineLeadingMatch[2] || "")
    } else if (parenGramsMatch) {
      grams = parenGramsMatch[1] || ""
      productName = sanitizeScannedProductName(
        currentLine.replace(parenGramsMatch[0], "")
      )
    } else if (looseGramsMatch) {
      grams = looseGramsMatch[1] || ""
      productName = sanitizeScannedProductName(
        currentLine.replace(looseGramsMatch[0], "")
      )
    } else {
      const nextLineGramsMatch =
        nextLine.match(GRAMS_ONLY_PATTERN) || nextLine.match(PAREN_GRAMS_PATTERN)

      const currentLineLooksLikeName =
        /[a-z]/i.test(currentLine) &&
        !looksLikeReceiptJunk(currentLine) &&
        !looksLikeAddressLine(currentLine) &&
        !/\b(am|pm)\b/i.test(currentLine) &&
        !DATE_PATTERN.test(currentLine) &&
        !MONTH_NAME_DATE_PATTERN.test(currentLine) &&
        !TOTAL_GRAMS_PATTERN.test(currentLine)

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
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const lines = rawLines.filter((line) => line.length >= 2)

  const { purchaseDate, purchaseTime } = extractDateAndTime(lines, rawText)
  const dispensaryResult = extractDispensary(lines, rawText)

  let parsedItems = extractItemsFromLines(lines)

  const totalGrams = extractTotalGrams(lines)

  if (parsedItems.length === 0 && totalGrams && Number(totalGrams) > 0) {
    parsedItems = [
      {
        id: crypto.randomUUID(),
        productName: "Receipt Total",
        category: "flower",
        grams: totalGrams,
      },
    ]
  }

  return {
    dispensary: dispensaryResult.dispensary,
    purchaseDate,
    purchaseTime,
    items: parsedItems.length > 0 ? parsedItems : [createEmptyItem()],
    rawText,
    dispensaryConfidence: dispensaryResult.dispensaryConfidence,
    dispensaryPoints: dispensaryResult.dispensaryPoints,
    dispensaryMatchedBy: dispensaryResult.dispensaryMatchedBy,
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

  let score = 0

  if (parsed.dispensaryPoints >= 7) score += 3
  else if (parsed.dispensaryPoints >= 4) score += 2
  else if (detectedFields.dispensary) score += 1

  if (detectedFields.purchaseDate) score += 2
  if (detectedFields.purchaseTime) score += 1
  if (validItems.length > 0) score += 3
  if (validItems.length > 1) score += 1

  if (warnings.length >= 3) score -= 2
  else if (warnings.length >= 1) score -= 1

  let confidence: ScanConfidence = "low"

  if (score >= 7) {
    confidence = "high"
  } else if (score >= 4) {
    confidence = "medium"
  }

  return {
    confidence,
    warnings,
    missingFields,
    detectedFields,
    points: score,
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
  if (confidence === "high") return "Scan successful"
  if (confidence === "medium") return "Scan needs review"
  return "Scan may be incomplete"
}

export function getValidationDescription(validation: ScanValidationResult) {
  if (validation.confidence === "high") {
    return "Looks good. Please review and confirm before saving."
  }

  if (validation.confidence === "medium") {
    return "We found most details. Please review a few fields before saving."
  }

  return "We had trouble reading this receipt. Please check all details carefully."
}