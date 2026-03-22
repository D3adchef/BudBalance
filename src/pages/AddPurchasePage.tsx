import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import Tesseract from "tesseract.js"
import cv from "@techstark/opencv-js"
import PageIntroPopup from "../components/PageIntroPopup"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useFavoritesStore } from "../features/favorites/favoritesStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"

type DraftItem = {
  id: string
  productName: string
  category: string
  grams: string
}

type ParsedReceipt = {
  dispensary: string
  purchaseDate: string
  purchaseTime: string
  items: DraftItem[]
  rawText: string
}

function createEmptyItem(): DraftItem {
  return {
    id: crypto.randomUUID(),
    productName: "",
    category: "",
    grams: "",
  }
}

function getItemSummary(item: DraftItem) {
  const parts = []

  if (item.productName.trim()) parts.push(item.productName.trim())
  if (item.category.trim()) parts.push(item.category.trim())
  if (item.grams.trim()) parts.push(`${item.grams}g`)

  return parts.length > 0 ? parts.join(" • ") : "Tap to add details"
}

function normalizeDateForInput(value: string) {
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

function normalizeTimeForInput(value: string) {
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

function convertTo24HourTime(
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

function getTimePartsFrom24Hour(value: string) {
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

function buildPurchaseDateTime(purchaseDate: string, purchaseTime: string) {
  return `${purchaseDate}T${purchaseTime}`
}

function guessCategory(productName: string) {
  const name = productName.toLowerCase()

  if (
    name.includes("pre-roll") ||
    name.includes("preroll") ||
    name.includes("joint")
  ) {
    return "pre-roll"
  }

  if (
    name.includes("gummy") ||
    name.includes("edible") ||
    name.includes("chocolate") ||
    name.includes("chew")
  ) {
    return "edible"
  }

  if (
    name.includes("vape") ||
    name.includes("cart") ||
    name.includes("cartridge")
  ) {
    return "vape"
  }

  if (
    name.includes("wax") ||
    name.includes("shatter") ||
    name.includes("badder") ||
    name.includes("live resin") ||
    name.includes("concentrate")
  ) {
    return "concentrate"
  }

  return "flower"
}

function parseReceiptText(rawText: string): ParsedReceipt {
  const rawLines = rawText
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)

  const lines = rawLines.filter((line) => line.length >= 2)

  const datePattern =
    /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{1,2}-\d{1,2})\b/
  const foundDate =
    lines.find((line) => datePattern.test(line))?.match(datePattern)?.[0] || ""

  const timePattern = /\b(\d{1,2}:\d{2}\s?(?:AM|PM|am|pm)|\d{1,2}:\d{2})\b/
  const foundTime =
    lines.find((line) => timePattern.test(line))?.match(timePattern)?.[0] || ""

  const normalizedDate = normalizeDateForInput(foundDate)
  const normalizedTime = normalizeTimeForInput(foundTime)

  const dispensaryBlacklist = [
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
  ]

  const dispensary =
    lines.find((line) => {
      const lower = line.toLowerCase()

      if (lower.length < 3) return false
      if (datePattern.test(lower)) return false
      if (timePattern.test(lower)) return false
      if (/\d{3}[-.)\s]\d{3}[-.\s]\d{4}/.test(lower)) return false
      if (dispensaryBlacklist.some((term) => lower.includes(term))) return false

      return /[a-z]/i.test(lower)
    }) || ""

  const itemCandidates = lines.filter((line) => {
    const lower = line.toLowerCase()

    if (!/\b\d+(\.\d+)?\s?g\b/i.test(line)) return false
    if (
      lower.includes("subtotal") ||
      lower.includes("total") ||
      lower.includes("tax") ||
      lower.includes("discount") ||
      lower.includes("change") ||
      lower.includes("balance")
    ) {
      return false
    }

    return true
  })

  const parsedItems: DraftItem[] = itemCandidates.map((line) => {
    const gramsMatch = line.match(/(\d+(\.\d+)?)\s?g\b/i)
    const grams = gramsMatch?.[1] || ""

    let productName = line
    if (gramsMatch?.[0]) {
      productName = productName.replace(gramsMatch[0], "")
    }

    productName = productName
      .replace(/\$?\d+(\.\d{2})?/g, "")
      .replace(/\s{2,}/g, " ")
      .replace(/[-•|]+/g, " ")
      .trim()

    return {
      id: crypto.randomUUID(),
      productName: productName || "Scanned Item",
      category: guessCategory(productName || line),
      grams,
    }
  })

  return {
    dispensary,
    purchaseDate: normalizedDate,
    purchaseTime: normalizedTime,
    items: parsedItems.length > 0 ? parsedItems : [createEmptyItem()],
    rawText,
  }
}

function createLocalDateTime(dateString: string, timeString: string) {
  return new Date(`${dateString}T${timeString || "00:00"}:00`)
}

export default function AddPurchasePage() {
  const addPurchase = usePurchaseStore((state) => state.addPurchase)
  const favoriteDispensaries = useFavoritesStore(
    (state) => state.favoriteDispensaries
  )
  const favoritePurchases = useFavoritesStore(
    (state) => state.favoritePurchases
  )
  const loadFavoritesForCurrentUser = useFavoritesStore(
    (state) => state.loadFavoritesForCurrentUser
  )

  const allotment = useAllotmentStore((state) => state.allotment)
  const loadAllotmentForCurrentUser = useAllotmentStore(
    (state) => state.loadAllotmentForCurrentUser
  )
  const setSetupMode = useAllotmentStore((state) => state.setSetupMode)
  const completeInitialSetup = useAllotmentStore(
    (state) => state.completeInitialSetup
  )

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const notesRef = useRef<HTMLTextAreaElement | null>(null)

  const [dispensary, setDispensary] = useState("")
  const [selectedFavoriteDispensary, setSelectedFavoriteDispensary] = useState("")
  const [notes, setNotes] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")
  const [purchaseHour, setPurchaseHour] = useState("")
  const [purchaseMinute, setPurchaseMinute] = useState("")
  const [purchasePeriod, setPurchasePeriod] = useState("AM")
  const [items, setItems] = useState<DraftItem[]>([createEmptyItem()])
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [ocrImage, setOcrImage] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanStatus, setScanStatus] = useState("")
  const [saveMessage, setSaveMessage] = useState("")
  const [isSavingPurchase, setIsSavingPurchase] = useState(false)

  const purchaseTime = convertTo24HourTime(
    purchaseHour,
    purchaseMinute,
    purchasePeriod
  )

  useEffect(() => {
    loadFavoritesForCurrentUser()
    loadAllotmentForCurrentUser()
  }, [loadFavoritesForCurrentUser, loadAllotmentForCurrentUser])

  useEffect(() => {
    console.log("OpenCV loaded:", cv)
  }, [])

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  useEffect(() => {
    async function attachStream() {
      if (!videoRef.current || !stream) return

      const video = videoRef.current
      video.srcObject = stream

      try {
        await video.play()
      } catch (error) {
        console.error("Video play error:", error)
      }
    }

    attachStream()
  }, [stream])

  useEffect(() => {
    if (!notesRef.current) return

    notesRef.current.style.height = "0px"
    notesRef.current.style.height = `${Math.max(
      44,
      notesRef.current.scrollHeight
    )}px`
  }, [notes])

  useEffect(() => {
    if (!saveMessage) return

    const timeout = window.setTimeout(() => {
      setSaveMessage("")
    }, 2500)

    return () => window.clearTimeout(timeout)
  }, [saveMessage])

  function preprocessCanvasImage(canvas: HTMLCanvasElement) {
    const src = cv.imread(canvas)
    const gray = new cv.Mat()
    const normalized = new cv.Mat()

    try {
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0)
      cv.normalize(gray, normalized, 0, 255, cv.NORM_MINMAX)
      cv.imshow(canvas, normalized)
    } finally {
      src.delete()
      gray.delete()
      normalized.delete()
    }
  }

  function buildProcessedImageFromCanvas(sourceCanvas: HTMLCanvasElement) {
    const tempCanvas = document.createElement("canvas")
    tempCanvas.width = sourceCanvas.width
    tempCanvas.height = sourceCanvas.height

    const tempContext = tempCanvas.getContext("2d")
    if (!tempContext) return null

    tempContext.drawImage(sourceCanvas, 0, 0)
    preprocessCanvasImage(tempCanvas)

    return tempCanvas.toDataURL("image/png")
  }

  async function startCamera() {
    try {
      stopCamera()
      setCameraError("")
      setReceiptImage(null)
      setOcrImage(null)
      setScanStatus("")
      setSaveMessage("")

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })

      setStream(mediaStream)
      setCameraActive(true)
    } catch (error) {
      console.error("Camera error:", error)
      setCameraError(
        "Unable to access the camera. You can still use Upload File instead."
      )
      setCameraActive(false)
    }
  }

  function stopCamera() {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
    }

    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
    }

    setStream(null)
    setCameraActive(false)
  }

  function capturePhoto() {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setCameraError(
        "Camera image is not ready yet. Give it a second and try again."
      )
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext("2d")
    if (!context) return

    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const rawImageDataUrl = canvas.toDataURL("image/png")
    const processedImageDataUrl = buildProcessedImageFromCanvas(canvas)

    setReceiptImage(rawImageDataUrl)
    setOcrImage(processedImageDataUrl)
    setCameraError("")
    setScanStatus("Receipt image ready to scan.")
    setSaveMessage("")
    stopCamera()
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file || !canvasRef.current) return

    const reader = new FileReader()

    reader.onloadend = () => {
      const imageSource = reader.result as string
      const image = new Image()

      image.onload = () => {
        const canvas = canvasRef.current
        if (!canvas) return

        const context = canvas.getContext("2d")
        if (!context) return

        canvas.width = image.width
        canvas.height = image.height

        context.drawImage(image, 0, 0, canvas.width, canvas.height)

        const rawImage = canvas.toDataURL("image/png")
        const processedImage = buildProcessedImageFromCanvas(canvas)

        setReceiptImage(rawImage)
        setOcrImage(processedImage)
        setCameraError("")
        setScanStatus("Receipt image ready to scan.")
        setSaveMessage("")
        stopCamera()
      }

      image.onerror = () => {
        setCameraError("Unable to load that image. Please try another file.")
      }

      image.src = imageSource
    }

    reader.onerror = () => {
      setCameraError("Unable to read that file. Please try again.")
    }

    reader.readAsDataURL(file)
  }

  function clearImage() {
    setReceiptImage(null)
    setOcrImage(null)
    setCameraError("")
    setScanStatus("")
  }

  function updateItem(
    itemId: string,
    field: keyof Omit<DraftItem, "id">,
    value: string
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId ? { ...item, [field]: value } : item
      )
    )
  }

  function applyFavoritePurchase(itemId: string, favoriteId: string) {
    const selectedFavorite = favoritePurchases.find(
      (favorite) => favorite.id === favoriteId
    )

    if (!selectedFavorite) return

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              productName: selectedFavorite.name,
              category: selectedFavorite.category,
              grams: String(selectedFavorite.grams),
            }
          : item
      )
    )
  }

  async function handleScanReceipt() {
    if (!receiptImage) {
      alert("Please capture or upload a receipt image first.")
      return
    }

    try {
      setIsScanning(true)
      setScanStatus("Reading receipt...")

      const imageToScan = ocrImage || receiptImage

      const result = await Tesseract.recognize(imageToScan, "eng", {
        logger: (message) => {
          if (
            message.status === "recognizing text" &&
            typeof message.progress === "number"
          ) {
            setScanStatus(`Reading receipt... ${Math.round(message.progress * 100)}%`)
          }
        },
      })

      const parsed = parseReceiptText(result.data.text)

      if (parsed.dispensary) {
        setDispensary(parsed.dispensary)
      }

      if (parsed.purchaseDate) {
        setPurchaseDate(parsed.purchaseDate)
      }

      if (parsed.purchaseTime) {
        const timeParts = getTimePartsFrom24Hour(parsed.purchaseTime)
        setPurchaseHour(timeParts.hour)
        setPurchaseMinute(timeParts.minute)
        setPurchasePeriod(timeParts.period)
      }

      if (
        parsed.items.length > 0 &&
        parsed.items.some(
          (item) => item.productName || item.category || item.grams
        )
      ) {
        setItems(parsed.items)
        setExpandedItemId(parsed.items[0]?.id ?? null)
      }

      setNotes((currentNotes) => {
        if (currentNotes.trim()) return currentNotes
        return "Scanned from receipt image."
      })

      setScanStatus("Receipt scanned. Please review the details before saving.")
    } catch (error) {
      console.error("Receipt scan error:", error)
      setScanStatus("Unable to scan this receipt. Please enter details manually.")
    } finally {
      setIsScanning(false)
    }
  }

  function addAnotherItem() {
    const newItem = createEmptyItem()

    setItems((currentItems) => [...currentItems, newItem])
    setExpandedItemId(newItem.id)
  }

  function removeItem(itemId: string) {
    setItems((currentItems) => {
      if (currentItems.length === 1) return currentItems

      const filtered = currentItems.filter((item) => item.id !== itemId)

      if (expandedItemId === itemId) {
        setExpandedItemId(filtered[filtered.length - 1]?.id ?? null)
      }

      return filtered
    })
  }

  function toggleExpanded(itemId: string) {
    setExpandedItemId((current) => (current === itemId ? null : itemId))
  }

  function handleFavoriteDispensaryChange(value: string) {
    setSelectedFavoriteDispensary(value)
    if (value) {
      setDispensary(value)
    }
  }

  function resetForm() {
    setDispensary("")
    setSelectedFavoriteDispensary("")
    setNotes("")
    setPurchaseDate("")
    setPurchaseHour("")
    setPurchaseMinute("")
    setPurchasePeriod("AM")
    const firstItem = createEmptyItem()
    setItems([firstItem])
    setExpandedItemId(null)
    setReceiptImage(null)
    setOcrImage(null)
    setCameraError("")
    setScanStatus("")
    stopCamera()
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!purchaseDate) {
      alert("Please complete Purchase Date.")
      return
    }

    if (!purchaseTime) {
      alert("Please complete Purchase Time.")
      return
    }

    const hasInvalidItem = items.some(
      (item) => !item.productName || !item.category || !item.grams
    )

    if (hasInvalidItem) {
      alert("Please complete Product Name, Category, and Grams for each item.")
      return
    }

    const source = receiptImage ? "scan" : "manual"
    const purchaseDateTime = buildPurchaseDateTime(purchaseDate, purchaseTime)
    const purchaseDateObject = createLocalDateTime(purchaseDate, purchaseTime)

    let countsTowardAllotment = true
    let entryMode: "setup" | "manual" | "scan" | "historical" =
      source === "scan" ? "scan" : "manual"

    if (
      allotment.setupMode === "manual" &&
      allotment.manualSetupCompletedAt
    ) {
      const manualSetupDate = new Date(allotment.manualSetupCompletedAt)

      if (
        !Number.isNaN(purchaseDateObject.getTime()) &&
        !Number.isNaN(manualSetupDate.getTime()) &&
        purchaseDateObject < manualSetupDate
      ) {
        countsTowardAllotment = false
        entryMode = "historical"
      }
    }

    setIsSavingPurchase(true)

    try {
      await addPurchase({
        id: crypto.randomUUID(),
        purchaseDate,
        purchaseTime,
        purchaseDateTime,
        dispensary,
        notes,
        source,
        countsTowardAllotment,
        entryMode,
        items: items.map((item) => ({
          id: item.id,
          productName: item.productName,
          category: item.category,
          grams: Number(item.grams),
        })),
      })

      await setSetupMode("purchases")
      await completeInitialSetup()

      resetForm()
      setSaveMessage("Purchase saved. You can add another one now.")
    } catch (error) {
      console.error("Failed to save purchase:", error)
      alert("Unable to save purchase right now. Please try again.")
    } finally {
      setIsSavingPurchase(false)
    }
  }

  return (
    <>
      <PageIntroPopup
        pageKey="add-purchase"
        title="Add a Purchase"
        description="Use this page to manually enter a purchase or scan a receipt to speed things up. Add each item from the purchase so BudBalance can track your active grams correctly."
      />

      <div className="space-y-4">
        <div className="px-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
            BudBalance
          </p>
          <h2 className="mt-1 text-lg font-semibold text-white">Add Purchase</h2>
          <p className="mt-1 text-xs text-slate-400">
            Capture a receipt or enter one purchase with multiple items.
          </p>
        </div>

        {saveMessage && (
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {saveMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
            <div className="space-y-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Smart Scan</h3>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Use your camera or upload a receipt/package photo, then
                      confirm the details and line items below.
                    </p>
                  </div>

                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
                    Optional
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
                  >
                    <span aria-hidden="true">📷</span>
                    <span>Camera</span>
                  </button>

                  <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10">
                    <span aria-hidden="true">📁</span>
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && (
                  <p className="mt-3 rounded-2xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                    {cameraError}
                  </p>
                )}

                {cameraActive && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-3">
                    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="block max-h-[300px] w-full object-cover"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
                      >
                        Capture
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {receiptImage && (
                  <div className="mt-3 space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-3">
                    <img
                      src={receiptImage}
                      alt="Receipt preview"
                      className="w-full rounded-2xl border border-white/10"
                    />

                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleScanReceipt}
                        disabled={isScanning}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isScanning ? "Scanning..." : "Scan Receipt"}
                      </button>

                      <button
                        type="button"
                        onClick={clearImage}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                      >
                        Remove Image
                      </button>
                    </div>

                    {scanStatus && (
                      <p className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                        {scanStatus}
                      </p>
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">
                    Purchase Details
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    These details apply to the whole purchase/receipt.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Purchase Date
                      </label>
                      <input
                        type="date"
                        value={purchaseDate}
                        onChange={(e) => setPurchaseDate(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                        Purchase Time
                      </label>

                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={purchaseHour}
                          onChange={(e) => setPurchaseHour(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={String(i + 1)}>
                              {i + 1}
                            </option>
                          ))}
                        </select>

                        <select
                          value={purchaseMinute}
                          onChange={(e) => setPurchaseMinute(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        >
                          <option value="">Min</option>
                          {Array.from({ length: 60 }, (_, i) => {
                            const value = String(i).padStart(2, "0")
                            return (
                              <option key={value} value={value}>
                                {value}
                              </option>
                            )
                          })}
                        </select>

                        <select
                          value={purchasePeriod}
                          onChange={(e) => setPurchasePeriod(e.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Dispensary
                    </label>

                    {favoriteDispensaries.length > 0 && (
                      <select
                        value={selectedFavoriteDispensary}
                        onChange={(e) =>
                          handleFavoriteDispensaryChange(e.target.value)
                        }
                        className="mb-2 w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                      >
                        <option value="">Choose favorite dispensary</option>
                        {favoriteDispensaries.map((favorite) => (
                          <option key={favorite} value={favorite}>
                            {favorite}
                          </option>
                        ))}
                      </select>
                    )}

                    <input
                      placeholder="Optional dispensary name"
                      value={dispensary}
                      onChange={(e) => setDispensary(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Notes
                    </label>
                    <textarea
                      ref={notesRef}
                      placeholder="Optional notes for the whole purchase"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full resize-none overflow-hidden rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                      rows={1}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-5">
                <div className="mb-3">
                  <h3 className="text-sm font-semibold text-white">Items</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Add every product from this purchase.
                  </p>
                </div>

                <div className="space-y-3">
                  {items.map((item, index) => {
                    const isExpanded = expandedItemId === item.id

                    return (
                      <div
                        key={item.id}
                        className="rounded-2xl border border-white/10 bg-slate-950/80"
                      >
                        <button
                          type="button"
                          onClick={() => toggleExpanded(item.id)}
                          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">
                              Item {index + 1}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-400">
                              {getItemSummary(item)}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-400">
                            {isExpanded ? "−" : "+"}
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-white/10 px-3 pb-3 pt-3">
                            <div className="mb-3 flex items-center justify-end">
                              {items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeItem(item.id)}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15"
                                >
                                  Remove
                                </button>
                              )}
                            </div>

                            <div className="space-y-3">
                              {favoritePurchases.length > 0 && (
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Favorite Purchase
                                  </label>
                                  <select
                                    defaultValue=""
                                    onChange={(e) =>
                                      applyFavoritePurchase(item.id, e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                                  >
                                    <option value="">Choose favorite purchase</option>
                                    {favoritePurchases.map((favorite) => (
                                      <option key={favorite.id} value={favorite.id}>
                                        {favorite.name} • {favorite.category} •{" "}
                                        {favorite.grams}g
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div>
                                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                  Product Name
                                </label>
                                <input
                                  placeholder="Enter product name"
                                  value={item.productName}
                                  onChange={(e) =>
                                    updateItem(item.id, "productName", e.target.value)
                                  }
                                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Category
                                  </label>
                                  <select
                                    value={item.category}
                                    onChange={(e) =>
                                      updateItem(item.id, "category", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500"
                                  >
                                    <option value="">Select category</option>
                                    <option value="flower">Flower</option>
                                    <option value="pre-roll">Pre-Roll</option>
                                    <option value="edible">Edible</option>
                                    <option value="vape">Vape</option>
                                    <option value="concentrate">Concentrate</option>
                                  </select>
                                </div>

                                <div>
                                  <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                    Grams
                                  </label>
                                  <input
                                    placeholder="0.0"
                                    type="number"
                                    step="0.01"
                                    value={item.grams}
                                    onChange={(e) =>
                                      updateItem(item.id, "grams", e.target.value)
                                    }
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    onClick={addAnotherItem}
                    className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/15"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSavingPurchase}
            className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSavingPurchase ? "Saving Purchase..." : "Save Purchase"}
          </button>
        </form>
      </div>
    </>
  )
}