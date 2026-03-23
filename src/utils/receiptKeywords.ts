export const PRE_ROLL_KEYWORDS: string[] = [
  "pre-roll",
  "preroll",
  "pre roll",
  "joint",
  "infused pre-roll",
  "infused preroll",
  "blunt",
  "cone",
]

export const EDIBLE_KEYWORDS: string[] = [
  "gummy",
  "gummies",
  "edible",
  "edibles",
  "chew",
  "chews",
  "chocolate",
  "cookie",
  "brownie",
  "mint",
  "troche",
  "drink",
  "beverage",
]

export const VAPE_KEYWORDS: string[] = [
  "vape",
  "cart",
  "cartridge",
  "pod",
  "disposable",
  "distillate",
  "disty",
  "510",
]

export const CONCENTRATE_KEYWORDS: string[] = [
  "concentrate",
  "wax",
  "shatter",
  "badder",
  "budder",
  "live resin",
  "live rosin",
  "rosin",
  "resin",
  "sauce",
  "diamond",
  "diamonds",
  "crumble",
  "hash",
]

export const FLOWER_KEYWORDS: string[] = [
  "flower",
  "smalls",
  "shake",
  "bud",
  "whole flower",
  "ground flower",
]

export const COMMON_CANNABIS_SHORTHAND: string[] = [
  "pr",
  "1/8",
  "eighth",
  "1/4",
  "quarter",
  "1/2",
  "half",
  "oz",
  "2pk",
  "5pk",
  "10pk",
  "pk",
  "mg",
  "thc",
  "cbd",
]

export const PRODUCT_NAME_NOISE_WORDS: string[] = [
  "qty",
  "quantity",
  "item",
  "items",
  "subtotal",
  "total",
  "tax",
  "discount",
  "change",
  "balance",
  "cash",
  "card",
  "visa",
  "debit",
  "mastercard",
  "auth",
  "approval",
]

export const RECEIPT_JUNK_WORDS: string[] = [
  "subtotal",
  "total",
  "tax",
  "discount",
  "change",
  "balance",
  "cash",
  "visa",
  "mastercard",
  "debit",
  "auth",
  "approval",
  "thank you",
  "transaction",
  "invoice",
  "receipt",
  "cashier",
  "loyalty",
  "points",
  "phone",
  "www",
]

export const DISPENSARY_BLACKLIST_WORDS: string[] = [
  "subtotal",
  "total",
  "tax",
  "change",
  "cash",
  "visa",
  "mastercard",
  "debit",
  "receipt",
  "transaction",
  "invoice",
  "discount",
  "balance",
  "items",
  "thank you",
  "www",
  "phone",
  "date",
  "time",
  "street",
  "road",
  "ave",
  "avenue",
  "blvd",
  "boulevard",
]

export const DATE_PATTERN =
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\b/

export const TIME_PATTERN =
  /\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)|\d{1,2}:\d{2})\b/

export const PHONE_PATTERN = /\d{3}[-.)\s]\d{3}[-.\s]\d{4}/

export const GRAMS_INLINE_TRAILING_PATTERN = /^(.*?)(\d+(?:\.\d+)?)\s?g\b/i
export const GRAMS_INLINE_LEADING_PATTERN = /^(\d+(?:\.\d+)?)\s?g\b\s*(.*)$/i
export const GRAMS_ONLY_PATTERN = /^(\d+(?:\.\d+)?)\s?g\b$/i
export const MG_PATTERN = /\b\d+\s?mg\b/i