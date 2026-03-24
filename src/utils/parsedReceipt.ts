import type { DraftItem } from "./purchaseItemHelpers"

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