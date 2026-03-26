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

const MONTH_NAME_DATE_WITH_AT_TIME_PATTERN =
  /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\s+at\s+\d{1,2}[:.;]\d{2}(?:\s?(?:AM|PM|am|pm))?\b/i

const TIME_WITH_OPTIONAL_SECONDS_PATTERN =
  /\b(\d{1,2}:\d{2}(?::\d{2})?\s?(?:AM|PM|am|pm)?|\d{1,2}:\d{2})\b/

const TOTAL_GRAMS_PATTERN =
  /\btotal\s+grams?\s*[:\-]?\s*(\d*\.?\d+)\b/i

const TOTAL_ITEMS_PATTERN =
  /\btotal\s+items?\s*[:\-]?\s*(\d+)\b/i

const STARTING_ALLOTMENT_PATTERN =
  /\bstarting\s+allotment\s*[:\-]?\s*(\d*\.?\d+)\s*g?\b/i

const REMAINING_ALLOTMENT_PATTERN =
  /\bremaining\s+allotment\s*[:\-]?\s*(\d*\.?\d+)\s*g?\b/i

const PAREN_GRAMS_PATTERN =
  /\((\d*\.?\d+)\s?g\)/i

const LOOSE_GRAMS_PATTERN =
  /(\d*\.?\d+)\s?g\b/i

const NUMERIC_DATE_CANDIDATE_PATTERN =
  /\b\d{1,4}\s*[\/\-.]\s*\d{1,2}\s*[\/\-.]\s*\d{1,4}\b/

const OCR_FLEX_TIME_PATTERN =
  /\b\d{1,2}\s*[:.;]\s*\d{2}(?:\s*[:.;]\s*\d{2})?\s*(?:AM|PM|am|pm)?\b/

const COMPACT_TIME_WITH_MERIDIEM_PATTERN =
  /\b\d{3,4}\s*(?:AM|PM|am|pm)\b/

const SPACED_TIME_WITH_MERIDIEM_PATTERN =
  /\b\d{1,2}\s+\d{2}\s*(?:AM|PM|am|pm)\b/

const HEADER_HINT_PATTERN =
  /\b(dispensary|cannabis|wellness|pharmacy|rx|patient|register|cashier|order|invoice|pickup)\b/i

const FOOTER_HINT_PATTERN =
  /\b(total|subtotal|tax|payment|cash|credit|debit|change|starting allotment|remaining allotment|total grams|total items|thank you)\b/i

const NON_ITEM_LINE_PATTERN =
  /\b(subtotal|total|tax|discount|payment|cash|debit|credit|change|loyalty|points|register|cashier|patient|order|invoice|receipt|sales tax|state tax|batch|sku|unit price|price|budtender|starting allotment|remaining allotment|total items|total grams|thank you|powered by)\b/i

type DispensaryMatch = {
  name: string
  normalizedName: string
  points: number
  confidence: "high" | "medium" | "low"
  matchedBy: string[]
}

type ReceiptZones = {
  headerLines: string[]
  itemLines: string[]
  footerLines: string[]
}

type FooterMetrics = {
  totalGrams: string
  totalItems: string
  startingAllotment: string
  remainingAllotment: string
  inferredUsedGrams: string
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim()
}

function cleanOCRText(value: string) {
  return normalizeWhitespace(
    value
      .replace(/[“”‘’`´]/g, "")
      .replace(/[–—]/g, "-")
      .replace(/[|]/g, " ")
      .replace(/(?<=\b\d)\s*[:.;]\s*(?=\d{2}\b)/g, ":")
      .replace(/(?<=\b\d)\s*[:.;]\s*(?=\d{2}\s*[AaPp][Mm]\b)/g, ":")
      .replace(/(?<=\b\d)\s*[:.;]\s*(?=\d{2}\s*[:.;]\s*\d{2}\b)/g, ":")
      .replace(/\b(\d)\s*[Oo]\b/g, "$10")
      .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase())
      .replace(/[^\w\s:/\-.(),]/g, " ")
  )
}

function normalizeOcrDigitsNearNumbers(value: string) {
  return value
    .replace(/(?<=\d)[oO](?=\d|\b)/g, "0")
    .replace(/(?<=\b\d)[lI](?=\d|\b)/g, "1")
    .replace(/(?<=\d)[lI](?=\d|\b)/g, "1")
}

function normalizeDateCandidate(value: string) {
  return normalizeWhitespace(
    normalizeOcrDigitsNearNumbers(value)
      .replace(/\s*([\/\-.])\s*/g, "$1")
      .replace(/,\s*/g, ", ")
      .replace(/\s{2,}/g, " ")
  )
}

function normalizeTimeCandidate(value: string) {
  let cleaned = normalizeWhitespace(normalizeOcrDigitsNearNumbers(value))
    .replace(/[.;]/g, ":")
    .replace(/\s*:\s*/g, ":")
    .replace(/\b(am|pm)\b/gi, (match) => match.toUpperCase())

  const compactMatch = cleaned.match(/^(\d{3,4})\s*(AM|PM)$/i)
  if (compactMatch) {
    const digits = compactMatch[1]
    const period = compactMatch[2].toUpperCase()
    const hour = digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2)
    const minute = digits.slice(-2)
    cleaned = `${hour}:${minute} ${period}`
  }

  const spacedMatch = cleaned.match(/^(\d{1,2})\s+(\d{2})\s*(AM|PM)$/i)
  if (spacedMatch) {
    cleaned = `${spacedMatch[1]}:${spacedMatch[2]} ${spacedMatch[3].toUpperCase()}`
  }

  const noSpaceMeridiemMatch = cleaned.match(/^(\d{1,2}:\d{2}(?::\d{2})?)(AM|PM)$/i)
  if (noSpaceMeridiemMatch) {
    cleaned = `${noSpaceMeridiemMatch[1]} ${noSpaceMeridiemMatch[2].toUpperCase()}`
  }

  const twentyFourHourPlusMeridiemMatch = cleaned.match(/^(\d{2}):(\d{2})\s*(AM|PM)$/i)
  if (twentyFourHourPlusMeridiemMatch) {
    const hour = Number(twentyFourHourPlusMeridiemMatch[1])
    const minute = twentyFourHourPlusMeridiemMatch[2]
    const period = twentyFourHourPlusMeridiemMatch[3].toUpperCase()

    if (hour > 12 && hour <= 23) {
      let displayHour = hour % 12
      if (displayHour === 0) displayHour = 12
      cleaned = `${displayHour}:${minute} ${period}`
    }
  }

  return cleaned
}

function roundToTwo(num: number) {
  return Math.round(num * 100) / 100
}

function splitReceiptIntoZones(lines: string[]): ReceiptZones {
  if (lines.length <= 6) {
    return {
      headerLines: lines.slice(0, Math.min(3, lines.length)),
      itemLines: lines,
      footerLines: lines.slice(-Math.min(3, lines.length)),
    }
  }

  const totalLines = lines.length
  const headerCount = Math.min(Math.max(Math.ceil(totalLines * 0.25), 6), 12)
  const footerCount = Math.min(Math.max(Math.ceil(totalLines * 0.25), 6), 12)

  const headerLines = lines.slice(0, headerCount)
  const footerLines = lines.slice(Math.max(totalLines - footerCount, headerCount))
  const itemLines = lines.slice(headerCount, Math.max(totalLines - footerCount, headerCount))

  return {
    headerLines,
    itemLines: itemLines.length > 0 ? itemLines : lines.slice(headerCount),
    footerLines,
  }
}

function getDateCandidatesFromText(value: string) {
  const cleaned = cleanOCRText(value)
  const candidates = new Set<string>()

  const monthDateWithTimeMatches =
    cleaned.match(new RegExp(MONTH_NAME_DATE_WITH_AT_TIME_PATTERN, "gi")) || []
  for (const match of monthDateWithTimeMatches) {
    const justDate = match.match(new RegExp(MONTH_NAME_DATE_PATTERN, "i"))?.[0]
    if (justDate) candidates.add(normalizeDateCandidate(justDate))
  }

  const monthNameMatches =
    cleaned.match(new RegExp(MONTH_NAME_DATE_PATTERN, "gi")) || []
  for (const match of monthNameMatches) {
    candidates.add(normalizeDateCandidate(match))
  }

  const numericMatches =
    cleaned.match(new RegExp(NUMERIC_DATE_CANDIDATE_PATTERN, "g")) || []
  for (const match of numericMatches) {
    candidates.add(normalizeDateCandidate(match))
  }

  const directDateMatches =
    cleaned.match(new RegExp(DATE_PATTERN, "g")) || []
  for (const match of directDateMatches) {
    candidates.add(normalizeDateCandidate(match))
  }

  return [...candidates]
}

function getTimeCandidatesFromText(value: string) {
  const cleaned = cleanOCRText(value)
  const candidates = new Set<string>()

  const inlineMonthDateTimeMatch = cleaned.match(
    new RegExp(MONTH_NAME_DATE_WITH_AT_TIME_PATTERN, "i")
  )
  if (inlineMonthDateTimeMatch?.[0]) {
    const timeInside = inlineMonthDateTimeMatch[0].match(
      /\d{1,2}[:.;]\d{2}(?:\s?(?:AM|PM|am|pm))?/i
    )?.[0]
    if (timeInside) {
      candidates.add(normalizeTimeCandidate(timeInside))
    }
  }

  const flexMatches =
    cleaned.match(new RegExp(OCR_FLEX_TIME_PATTERN, "gi")) || []
  for (const match of flexMatches) {
    candidates.add(normalizeTimeCandidate(match))
  }

  const standardMatches =
    cleaned.match(new RegExp(TIME_WITH_OPTIONAL_SECONDS_PATTERN, "gi")) || []
  for (const match of standardMatches) {
    candidates.add(normalizeTimeCandidate(match))
  }

  const compactMatches =
    cleaned.match(new RegExp(COMPACT_TIME_WITH_MERIDIEM_PATTERN, "gi")) || []
  for (const match of compactMatches) {
    candidates.add(normalizeTimeCandidate(match))
  }

  const spacedMatches =
    cleaned.match(new RegExp(SPACED_TIME_WITH_MERIDIEM_PATTERN, "gi")) || []
  for (const match of spacedMatches) {
    candidates.add(normalizeTimeCandidate(match))
  }

  return [...candidates]
}

function buildPriorityDateTimeSources(headerLines: string[], rawText: string) {
  const sources: string[] = []

  for (const line of headerLines.slice(0, 10)) {
    sources.push(line)
  }

  for (let index = 0; index < Math.min(10, headerLines.length); index += 1) {
    const combinedTwo = normalizeWhitespace(
      [headerLines[index], headerLines[index + 1]].filter(Boolean).join(" ")
    )
    const combinedThree = normalizeWhitespace(
      [headerLines[index], headerLines[index + 1], headerLines[index + 2]]
        .filter(Boolean)
        .join(" ")
    )

    if (combinedTwo) sources.push(combinedTwo)
    if (combinedThree) sources.push(combinedThree)
  }

  sources.push(rawText)

  return [
    ...new Set(
      sources.map((source) => normalizeWhitespace(source)).filter(Boolean)
    ),
  ]
}

export function normalizeDateForInput(value: string) {
  const trimmed = normalizeDateCandidate(value)

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

  const dottedIsoMatch = trimmed.match(/^(\d{4})\.(\d{1,2})\.(\d{1,2})$/)
  if (dottedIsoMatch) {
    const year = dottedIsoMatch[1]
    const month = dottedIsoMatch[2].padStart(2, "0")
    const day = dottedIsoMatch[3].padStart(2, "0")

    return `${year}-${month}-${day}`
  }

  const dottedMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{2,4})$/)
  if (dottedMatch) {
    const month = dottedMatch[1].padStart(2, "0")
    const day = dottedMatch[2].padStart(2, "0")
    const year =
      dottedMatch[3].length === 2 ? `20${dottedMatch[3]}` : dottedMatch[3]

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
  const trimmed = normalizeTimeCandidate(value)

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
    let hour = Number(weirdTwentyFourHourPlusMeridiem[1])
    const minute = weirdTwentyFourHourPlusMeridiem[2]
    const meridiem = weirdTwentyFourHourPlusMeridiem[3].toLowerCase()

    if (hour >= 0 && hour <= 23 && Number(minute) >= 0 && Number(minute) <= 59) {
      if (hour > 12) {
        return `${String(hour).padStart(2, "0")}:${minute}`
      }

      if (meridiem === "pm" && hour !== 12) hour += 12
      if (meridiem === "am" && hour === 12) hour = 0

      return `${String(hour).padStart(2, "0")}:${minute}`
    }
  }

  const compactMeridiem = trimmed.match(/^(\d{3,4})\s*(am|pm)$/i)
  if (compactMeridiem) {
    const digits = compactMeridiem[1]
    const meridiem = compactMeridiem[2].toLowerCase()
    const hour = Number(
      digits.length === 3 ? digits.slice(0, 1) : digits.slice(0, 2)
    )
    const minute = Number(digits.slice(-2))

    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      let resolvedHour = hour
      if (meridiem === "pm" && resolvedHour !== 12) resolvedHour += 12
      if (meridiem === "am" && resolvedHour === 12) resolvedHour = 0

      return `${String(resolvedHour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
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
    .replace(/\b(weight|batch|sku|unit|price|patient|register|cashier)\b/gi, "")
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

function looksLikeSummaryLine(line: string) {
  return (
    TOTAL_GRAMS_PATTERN.test(line) ||
    TOTAL_ITEMS_PATTERN.test(line) ||
    STARTING_ALLOTMENT_PATTERN.test(line) ||
    REMAINING_ALLOTMENT_PATTERN.test(line)
  )
}

function extractDateAndTime(headerLines: string[], rawText: string) {
  let bestDate = ""
  let bestTime = ""

  const sources = buildPriorityDateTimeSources(headerLines, rawText)

  for (const source of sources) {
    if (!bestDate) {
      const dateCandidates = getDateCandidatesFromText(source)

      for (const candidate of dateCandidates) {
        const normalized = normalizeDateForInput(candidate)
        if (normalized) {
          bestDate = normalized
          break
        }
      }
    }

    if (!bestTime) {
      const timeCandidates = getTimeCandidatesFromText(source)

      for (const candidate of timeCandidates) {
        const normalized = normalizeTimeForInput(candidate)
        if (normalized) {
          bestTime = normalized
          break
        }
      }
    }

    if (bestDate && bestTime) break
  }

  return {
    purchaseDate: bestDate,
    purchaseTime: bestTime,
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

function extractDispensary(headerLines: string[], rawText: string) {
  const likelyHeaderLines = headerLines.slice(0, 16)

  let bestMatch: DispensaryMatch | null = null
  let bestWeightedPoints = -1

  const candidateLines = [...likelyHeaderLines]

  for (let index = 0; index < Math.min(6, likelyHeaderLines.length); index += 1) {
    const combined = normalizeWhitespace(
      [likelyHeaderLines[index], likelyHeaderLines[index + 1]]
        .filter(Boolean)
        .join(" ")
    )
    if (combined) candidateLines.push(combined)
  }

  for (let index = 0; index < candidateLines.length; index += 1) {
    const line = candidateLines[index]
    const lower = line.toLowerCase()

    if (lower.length < 3) continue
    if (DATE_PATTERN.test(lower)) continue
    if (MONTH_NAME_DATE_PATTERN.test(lower)) continue
    if (TIME_PATTERN.test(lower)) continue
    if (TIME_WITH_OPTIONAL_SECONDS_PATTERN.test(lower)) continue
    if (OCR_FLEX_TIME_PATTERN.test(lower)) continue
    if (PHONE_PATTERN.test(lower)) continue
    if (looksLikeAddressLine(lower)) continue
    if (isBlacklistedDispensaryLine(lower)) continue
    if (!/[a-z]/i.test(lower)) continue

    const candidate = scoreDispensaryCandidate(line, rawText)
    if (!candidate) continue

    const isOriginalTopLine = index < likelyHeaderLines.length
    const headerBoost =
      isOriginalTopLine && index <= 2
        ? 3
        : isOriginalTopLine && index <= 5
          ? 2
          : isOriginalTopLine && HEADER_HINT_PATTERN.test(line)
            ? 1
            : 0

    const weightedPoints = candidate.points + headerBoost

    if (headerBoost > 0) {
      candidate.matchedBy = [
        ...candidate.matchedBy,
        `header-priority:+${headerBoost}`,
      ]
    }

    if (!bestMatch || weightedPoints > bestWeightedPoints) {
      bestMatch = {
        ...candidate,
        points: weightedPoints,
        confidence: getConfidenceFromPoints(weightedPoints),
      }
      bestWeightedPoints = weightedPoints
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

function extractFooterMetrics(footerLines: string[]): FooterMetrics {
  let totalGrams = ""
  let totalItems = ""
  let startingAllotment = ""
  let remainingAllotment = ""

  for (const line of footerLines) {
    if (!totalGrams) {
      const match = line.match(TOTAL_GRAMS_PATTERN)
      if (match?.[1]) totalGrams = match[1]
    }

    if (!totalItems) {
      const match = line.match(TOTAL_ITEMS_PATTERN)
      if (match?.[1]) totalItems = match[1]
    }

    if (!startingAllotment) {
      const match = line.match(STARTING_ALLOTMENT_PATTERN)
      if (match?.[1]) startingAllotment = match[1]
    }

    if (!remainingAllotment) {
      const match = line.match(REMAINING_ALLOTMENT_PATTERN)
      if (match?.[1]) remainingAllotment = match[1]
    }
  }

  let inferredUsedGrams = ""
  const starting = Number(startingAllotment)
  const remaining = Number(remainingAllotment)

  if (
    !Number.isNaN(starting) &&
    !Number.isNaN(remaining) &&
    starting >= remaining
  ) {
    inferredUsedGrams = String(roundToTwo(starting - remaining))
  }

  return {
    totalGrams,
    totalItems,
    startingAllotment,
    remainingAllotment,
    inferredUsedGrams,
  }
}

function scoreItemLineCandidate(line: string, zoneWeight = 0) {
  let points = zoneWeight
  const lower = line.toLowerCase()

  if (!line.trim()) return -999
  if (looksLikeReceiptJunk(line)) return -999
  if (looksLikeAddressLine(line)) return -999
  if (looksLikeSummaryLine(line)) return -999
  if (NON_ITEM_LINE_PATTERN.test(line)) return -999
  if (PHONE_PATTERN.test(line)) return -999
  if (DATE_PATTERN.test(line)) return -999
  if (MONTH_NAME_DATE_PATTERN.test(line)) return -999
  if (TIME_PATTERN.test(line) || OCR_FLEX_TIME_PATTERN.test(line)) return -999

  if (/[a-z]/i.test(line)) points += 2
  if (/[|]/.test(line)) points += 2
  if (PAREN_GRAMS_PATTERN.test(line)) points += 4
  if (LOOSE_GRAMS_PATTERN.test(line)) points += 4
  if (GRAMS_INLINE_LEADING_PATTERN.test(line)) points += 4
  if (GRAMS_INLINE_TRAILING_PATTERN.test(line)) points += 4
  if (/\b\d*\.?\d+\s?g\b/i.test(line)) points += 3

  if (
    PRE_ROLL_KEYWORDS.some((keyword) => lower.includes(keyword)) ||
    EDIBLE_KEYWORDS.some((keyword) => lower.includes(keyword)) ||
    VAPE_KEYWORDS.some((keyword) => lower.includes(keyword)) ||
    CONCENTRATE_KEYWORDS.some((keyword) => lower.includes(keyword)) ||
    FLOWER_KEYWORDS.some((keyword) => lower.includes(keyword))
  ) {
    points += 2
  }

  if (/\$/.test(line)) points -= 2
  if (/\bmg\b/i.test(line) && !/\bg\b/i.test(line)) points -= 2
  if (/^\d+(\.\d+)?$/.test(line.trim())) points -= 6
  if (lower.length < 4) points -= 3

  return points
}

function parseSingleItemLine(currentLine: string, nextLine: string) {
  const inlineTrailingMatch = currentLine.match(GRAMS_INLINE_TRAILING_PATTERN)
  const inlineLeadingMatch = currentLine.match(GRAMS_INLINE_LEADING_PATTERN)
  const parenGramsMatch = currentLine.match(PAREN_GRAMS_PATTERN)
  const looseGramsMatch = currentLine.match(LOOSE_GRAMS_PATTERN)

  let grams = ""
  let productName = ""
  let consumedNext = false

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
      !looksLikeSummaryLine(currentLine) &&
      !NON_ITEM_LINE_PATTERN.test(currentLine) &&
      !/\b(am|pm)\b/i.test(currentLine) &&
      !DATE_PATTERN.test(currentLine) &&
      !MONTH_NAME_DATE_PATTERN.test(currentLine)

    if (currentLineLooksLikeName && nextLineGramsMatch) {
      productName = sanitizeScannedProductName(currentLine)
      grams = nextLineGramsMatch[1] || ""
      consumedNext = true
    }
  }

  return { grams, productName, consumedNext }
}

function extractItemsFromItemZone(itemLines: string[], footerMetrics: FooterMetrics) {
  const parsedItems: DraftItem[] = []
  const seen = new Set<string>()

  for (let index = 0; index < itemLines.length; index += 1) {
    const currentLine = normalizeWhitespace(itemLines[index])
    const nextLine = normalizeWhitespace(itemLines[index + 1] || "")

    const currentScore = scoreItemLineCandidate(currentLine, 2)
    const nextScore = scoreItemLineCandidate(nextLine, 1)

    if (currentScore < 2) continue

    const { grams, productName, consumedNext } = parseSingleItemLine(
      currentLine,
      nextLine
    )

    if (!grams) continue

    const numericGrams = Number(grams)
    if (Number.isNaN(numericGrams) || numericGrams <= 0 || numericGrams > 28) {
      continue
    }

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

    if (consumedNext && nextScore >= 0) {
      index += 1
    }
  }

  const footerItemCount = Number(footerMetrics.totalItems)
  if (
    !Number.isNaN(footerItemCount) &&
    footerItemCount > 0 &&
    parsedItems.length > footerItemCount
  ) {
    return parsedItems.slice(0, footerItemCount)
  }

  return parsedItems
}

function extractItemsFromLines(lines: string[], footerMetrics: FooterMetrics) {
  const parsedItems: DraftItem[] = []
  const seen = new Set<string>()

  for (let index = 0; index < lines.length; index += 1) {
    const currentLine = normalizeWhitespace(lines[index])
    const nextLine = normalizeWhitespace(lines[index + 1] || "")

    if (!currentLine || looksLikeReceiptJunk(currentLine)) continue
    if (looksLikeSummaryLine(currentLine)) continue
    if (NON_ITEM_LINE_PATTERN.test(currentLine)) continue

    const { grams, productName, consumedNext } = parseSingleItemLine(
      currentLine,
      nextLine
    )

    if (!grams) continue

    const numericGrams = Number(grams)
    if (Number.isNaN(numericGrams) || numericGrams <= 0 || numericGrams > 28) {
      continue
    }

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

    if (consumedNext) {
      index += 1
    }
  }

  const footerItemCount = Number(footerMetrics.totalItems)
  if (
    !Number.isNaN(footerItemCount) &&
    footerItemCount > 0 &&
    parsedItems.length > footerItemCount
  ) {
    return parsedItems.slice(0, footerItemCount)
  }

  return parsedItems
}

function resolveBestFallbackItemSet(
  parsedItems: DraftItem[],
  footerMetrics: FooterMetrics
) {
  if (parsedItems.length > 0) return parsedItems

  const footerTotal = Number(footerMetrics.totalGrams)
  if (!Number.isNaN(footerTotal) && footerTotal > 0) {
    return [
      {
        id: crypto.randomUUID(),
        productName: "Receipt Total",
        category: "flower",
        grams: String(roundToTwo(footerTotal)),
      },
    ]
  }

  const inferredUsed = Number(footerMetrics.inferredUsedGrams)
  if (!Number.isNaN(inferredUsed) && inferredUsed > 0) {
    return [
      {
        id: crypto.randomUUID(),
        productName: "Receipt Total",
        category: "flower",
        grams: String(roundToTwo(inferredUsed)),
      },
    ]
  }

  return [createEmptyItem()]
}

export function parseReceiptText(rawText: string): ParsedReceipt {
  const rawLines = rawText
    .split("\n")
    .map((line) => normalizeWhitespace(line))
    .filter(Boolean)

  const lines = rawLines.filter((line) => line.length >= 2)
  const zones = splitReceiptIntoZones(lines)

  const { purchaseDate, purchaseTime } = extractDateAndTime(
    zones.headerLines,
    rawText
  )
  const dispensaryResult = extractDispensary(zones.headerLines, rawText)
  const footerMetrics = extractFooterMetrics(zones.footerLines)

  let parsedItems = extractItemsFromItemZone(zones.itemLines, footerMetrics)

  if (parsedItems.length === 0) {
    parsedItems = extractItemsFromLines(lines, footerMetrics)
  }

  parsedItems = resolveBestFallbackItemSet(parsedItems, footerMetrics)

  return {
    dispensary: dispensaryResult.dispensary,
    purchaseDate,
    purchaseTime,
    items: parsedItems,
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