export const PRE_ROLL_KEYWORDS: string[] = [
  "pre-roll",
  "preroll",
  "pre roll",
  "joint",
  "infused pre-roll",
  "infused preroll",
  "blunt",
  "cone",
  "dogwalker",
  "dog walker",
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
  "syrup",
  "tincture",
  "capsule",
  "tablet",
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
  "live cart",
  "all in one",
  "aio",
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
  "bubble hash",
  "hash rosin",
]

export const FLOWER_KEYWORDS: string[] = [
  "flower",
  "smalls",
  "shake",
  "bud",
  "whole flower",
  "ground flower",
  "premium flower",
  "indica",
  "sativa",
  "hybrid",
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
  "register",
  "cashier",
  "patient",
  "invoice",
  "receipt",
  "order",
  "unit",
  "price",
  "batch",
  "sku",
  "barcode",
  "loyalty",
  "points",
  "remaining",
  "starting",
  "allotment",
  "weight",
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
  "register",
  "drawer",
  "terminal",
  "batch",
  "sku",
  "barcode",
  "customer copy",
  "merchant copy",
  "unit price",
  "sales tax",
  "state tax",
  "payment",
  "paid",
  "change due",
  "remaining allotment",
  "starting allotment",
  "total grams",
  "total items",
  "order number",
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
  "customer copy",
  "merchant copy",
  "terminal",
  "batch",
  "register",
  "drawer",
  "subtotal",
  "payment",
  "sales tax",
  "state tax",
  "remaining allotment",
  "starting allotment",
  "total grams",
  "total items",
]

export const DATE_PATTERN =
  /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2}|\d{1,2}\.\d{1,2}\.\d{2,4}|\d{4}\.\d{1,2}\.\d{1,2})\b/

export const TIME_PATTERN =
  /\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)|\d{1,2}:\d{2})\b/

export const PHONE_PATTERN = /\d{3}[-.)\s]\d{3}[-.\s]\d{4}/

export const GRAMS_INLINE_TRAILING_PATTERN =
  /^(.*?)(\d+(?:\.\d+)?)\s?g\b/i
export const GRAMS_INLINE_LEADING_PATTERN =
  /^(\d+(?:\.\d+)?)\s?g\b\s*(.*)$/i
export const GRAMS_ONLY_PATTERN = /^(\d+(?:\.\d+)?)\s?g\b$/i
export const MG_PATTERN = /\b\d+\s?mg\b/i

export const MISSISSIPPI_DISPENSARY_NAMES_RAW = [
  "420 Bay St. Louis Dispensary, Inc.",
  "420 Columbus LLC",
  "420 Holiday #2, LLC",
  "420 Holiday #3 LLC",
  "420 Holiday #4, LLC",
  "420 Holiday #6, LLC",
  "420 Holiday LLC",
  "Aeroma Dispensary Company LLC",
  "AllsWell Brands, LLC",
  "Apollo Medical Dispensary LLC",
  "Apothecarium Green, LLC",
  "Arcane Enterprises",
  "Backwood Express #2 Inc",
  "Backwood Express, Inc.",
  "Bee's Buds",
  "Bee's Buds Dispensary Wiggins",
  "BILOXI CANNABIS DISPENSARY",
  "BioSciences of Mississippi, LLC",
  "Biosciences of MS LLC",
  "Blaze Dispensary LLC",
  "Blessed Goat",
  "Blessed Holdings LLC",
  "Bloom Medical Cannabis, LLC",
  "Blunt Buds LLC",
  "Bragg Canna of Mississippi, LLC",
  "Bud Barn, LLC.",
  "BWD Columbus LLC",
  "BWD County Line LLC",
  "BWD Meridian LLC",
  "Canablume, LLC",
  "Cannacare LLC",
  "CannaMiss LLC",
  "City Dispensary LLC",
  "Cleveland Cannabis Company LLC",
  "Coast Cannabis Bay St Louis LLC",
  "Coast Dispensary Inc",
  "Collinsville Wellness Dispensary, LLC",
  "Corinth Cannabis LLC",
  "Country Boys Investments LLC",
  "Cox-Blythe Dispensary Inc",
  "Cream Cannabis Company",
  "Cultivated Wellness Dispensary NO.1",
  "Cultivated Wellness Dispensary NO.2",
  "Cultivated Wellness Dispensary NO.3",
  "Culture Biloxi Shop, Inc.",
  "DABBS 1",
  "Dabbs 1 LLC",
  "DABBS 2 LLC",
  "Dabbs Cannabis Dispensary LLC",
  "Danknolia cannabis llc",
  "DELTA DISPENSARY MAGNOLIA",
  "Diamond Leaf",
  "Diamondhead Root LLC",
  "Diamondleaf",
  "Dixon Dispensary LLC",
  "Dolphin Dayz LLC",
  "Evergreen Dispensary LLC.",
  "Fabpharm",
  "Firefly Cannabis No. 2, LLC",
  "Firefly Cannabis, LLC",
  "Five Star Medical",
  "Five Star-2 LLC",
  "Good Day Dispensary",
  "Green Akers Cannabis Inc",
  "Green Dayz LLC",
  "Green Magnolia of Canton, LLC",
  "Green Magnolia of Columbus LLC",
  "Green Magnolia of Meridian LLC",
  "Green Spark, LLC",
  "Green Therapy LLC",
  "Happy Leaf LLC",
  "Hare Dispensary LLC",
  "HEMPNOTIZE MISSISSIPPI LLC",
  "Hernando Dispensary LLC",
  "High Cotton Wellness, LLC",
  "High Hopes Cannabis LLC",
  "Holistika LLC",
  "House of Buds",
  "HT Moss Point LLC",
  "Hybrid LLC",
  "Interstellar",
  "Interstellar Meridian",
  "Interstellar Tupelo, LLC",
  "Jamal Saeed",
  "James B. Abraham LLC",
  "Kelly's Green, Inc.",
  "Kudzu Cannabis Company, LLC",
  "Legally Rooted Cannabis Dispensary, LLC",
  "Lift Medical Cannabis Inc",
  "Lighthouse Gulfport LLC",
  "Local Remedy, LLC",
  "Long Beach Dispensary LLC",
  "LunaSol LLC",
  "Mageedp, LLC",
  "Magnolia Dispensaries, LLC.",
  "Magnolia Greens LLC",
  "Magnolia Medical Cannabis Company, LLC",
  "Mary Jane & Herb's LLC",
  "Mary Jane & Herbs LLC",
  "Medical Cannabis of MS, LLC",
  "Merit Creek",
  "Merit Creek LLC",
  "Mississippi Green Spa LLC",
  "Mississippi Magnolia Canna",
  "Mississippi Magnolia Canna West Point",
  "Mississippi Provisions 1, LLC",
  "Mississippi Provisions 4, LLC",
  "Mississippi Provisions 5, LLC",
  "MS Moss, LLC",
  "MS MUDD 1, LLC",
  "MS Mudd 2, LLC",
  "MS Mudd 3, LLC",
  "MS Mudd 4, LLC",
  "NUURR INC.",
  "Oddfellow Dispensary",
  "OPEN MIND 1",
  "PINE BELT MEDICINAL",
  "relief med inc",
  "River City Cannabis",
  "River Remedy Byram Dispensary, LLC",
  "Rootdown 1, LLC",
  "Rootdown 2, LLC",
  "Rootdown 3, LLC",
  "Rootdown 4, LLC",
  "RymedyRx, LLC",
  "SARBJOT LLC",
  "SB Greenwood, LLC",
  "SB Natchez, LLC",
  "SB O Springs, LLC",
  "SB Oxford",
  "SB Pearl, LLC",
  "SB Tupelo, LLC",
  "Simpson Legion",
  "Simpson Legion LLC",
  "Spillway Dispensary, LLC",
  "SRT-MS JAN, LLC",
  "Strong River Disp LLC",
  "Sunflower Holdings LLC",
  "SweetGrass MS, LLC",
  "The Cannabis Company, Inc.",
  "The Forest Cannabis Dispensary",
  "The Green Life Wellness, LLC.",
  "The Green Standard Grenada LLC",
  "The Green Standard LLC",
  "The Green Standard Starkville LLC",
  "The Green Standard Vicksburg LLC",
  "The Herbalist",
  "The Highest Care L.L.C",
  "The Islands Dispensary, LLC",
  "The Magg Dispensary, LLC",
  "The Magnolia Healing, LLC",
  "Toke and Tell Dispensary 2 LLC",
  "Toke and Tell Dispensary, LLC",
  "Tortuga Cannabis Company inc",
  "Tru Source Medical Cannabis, LLC",
  "Uptown Funk LLC",
  "VooDoo Buds 2",
  "VooDoo Buds LLC",
  "Wildflower LLC",
  "WYZE 1 llc",
  "WYZE 3 LLC",
  "Yazoodp, LLC",
  "Youngs Farm Medical Dispensary",
  "Zack Hemp LLC",
] as const

const DISPENSARY_LEGAL_SUFFIXES = [
  "llc",
  "l l c",
  "inc",
  "co",
  "company",
  "brands",
  "holdings",
  "enterprises",
] as const

const DISPENSARY_NOISE_WORDS = [
  "dispensary",
  "medical",
  "cannabis",
  "wellness",
] as const

const DISPENSARY_SPECIAL_ALIASES: Record<string, string[]> = {
  "420 bay st louis": [
    "420 bay st louis",
    "420 bay saint louis",
    "420 bay st. louis",
  ],
  "biosciences of mississippi": [
    "biosciences of ms",
    "biosciences ms",
  ],
  "diamond leaf": ["diamondleaf"],
  "mary jane and herbs": [
    "mary jane and herb s",
    "mary jane herbs",
  ],
  "dabbs 1": [
    "dabbs1",
    "dabbs",
  ],
  "dabbs 2": [
    "dabbs2",
    "dabbs",
  ],
  "firefly no 2": [
    "firefly 2",
    "firefly #2",
    "firefly cannabis 2",
    "firefly",
  ],
  "firefly": [
    "firefly cannabis",
  ],
  "local remedy": ["localremedy"],
  "merit creek": ["meritcreek"],
  "ms moss": ["msmoss"],
  "ms mudd 1": [
    "msmudd 1",
    "ms mudd one",
    "ms mudd",
  ],
  "ms mudd 2": [
    "msmudd 2",
    "ms mudd",
  ],
  "ms mudd 3": [
    "msmudd 3",
    "ms mudd",
  ],
  "ms mudd 4": [
    "msmudd 4",
    "ms mudd",
  ],
  "sb o springs": [
    "sb osprings",
    "sb ocean springs",
    "sb o springs",
    "starbuds ocean springs",
    "star buds ocean springs",
    "starbuds",
    "star buds",
  ],
  "strong river disp": [
    "strong river",
    "strong river dispensary",
  ],
  "toke and tell 2": [
    "toke and tell dispensary 2",
  ],
  "toke and tell": [
    "toke tell",
  ],
  "wyze 1": ["wyze1"],
  "wyze 3": ["wyze3"],
  "relief med": ["reliefmed"],
  "youngs farm": [
    "youngs farm medical",
    "youngs farm medical dispensary",
  ],
  "rootdown 1": ["rootdown"],
  "rootdown 2": ["rootdown"],
  "rootdown 3": ["rootdown"],
  "rootdown 4": ["rootdown"],
  "cultivated no 1": [
    "cultivated wellness",
    "cultivated",
  ],
  "cultivated no 2": [
    "cultivated wellness",
    "cultivated",
  ],
  "cultivated no 3": [
    "cultivated wellness",
    "cultivated",
  ],
  "the cannabis": [
    "the cannabis company",
    "cannabis company",
  ],
  "the herbalist": [
    "herbalist",
  ],
}

export function normalizeDispensaryName(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/saint/g, "st")
    .replace(/#/g, " ")
    .replace(/[.,/()'’-]/g, " ")
    .replace(/\bno\b/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function stripDispensaryWords(value: string, words: readonly string[]) {
  let result = value

  for (const word of words) {
    const pattern = new RegExp(
      `\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "g"
    )
    result = result.replace(pattern, " ")
  }

  return result.replace(/\s+/g, " ").trim()
}

function buildDispensaryAliases(rawName: string) {
  const aliases = new Set<string>()

  const normalized = normalizeDispensaryName(rawName)
  const withoutLegal = stripDispensaryWords(normalized, DISPENSARY_LEGAL_SUFFIXES)
  const withoutNoise = stripDispensaryWords(withoutLegal, DISPENSARY_NOISE_WORDS)

  if (normalized) aliases.add(normalized)
  if (withoutLegal) aliases.add(withoutLegal)
  if (withoutNoise) aliases.add(withoutNoise)

  const tokens = withoutNoise.split(" ").filter(Boolean)
  if (tokens.length >= 2) {
    aliases.add(tokens.slice(0, 2).join(" "))
  }

  if (tokens.length >= 3) {
    aliases.add(tokens.slice(0, 3).join(" "))
  }

  const specialAliases = DISPENSARY_SPECIAL_ALIASES[withoutNoise] ?? []
  for (const alias of specialAliases) {
    const normalizedAlias = normalizeDispensaryName(alias)
    if (normalizedAlias) aliases.add(normalizedAlias)
  }

  return [...aliases]
}

export const MISSISSIPPI_DISPENSARIES = MISSISSIPPI_DISPENSARY_NAMES_RAW.map((name) => {
  const normalized = normalizeDispensaryName(name)
  const normalizedWithoutLegal = stripDispensaryWords(
    normalized,
    DISPENSARY_LEGAL_SUFFIXES
  )
  const normalizedName = stripDispensaryWords(
    normalizedWithoutLegal,
    DISPENSARY_NOISE_WORDS
  )

  return {
    name,
    normalized,
    normalizedName,
    aliases: buildDispensaryAliases(name),
  }
})