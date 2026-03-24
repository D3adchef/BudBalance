import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import Tesseract from "tesseract.js"
import { usePurchaseStore } from "../features/purchases/purchaseStore"
import { useFavoritesStore } from "../features/favorites/favoritesStore"
import { useAllotmentStore } from "../features/allotment/allotmentStore"
import {
  type DraftItem,
  type ScanValidationResult,
  createEmptyItem,
  getTimePartsFrom24Hour,
  convertTo24HourTime,
  buildPurchaseDateTime,
  parseReceiptText,
  validateParsedReceipt,
  getValidationCardClasses,
  getValidationTitle,
  getValidationDescription,
} from "../utils/receiptParsing"
import { buildProcessedImageFromCanvas } from "../utils/receiptImageProcessing"
import { getItemSummary } from "../utils/purchaseItemHelpers"

type FinalConfirmMode = "manual" | "purchases" | null

export default function FirstTimeAllotmentSetupPage() {
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

  const loadAllotmentForCurrentUser = useAllotmentStore(
    (state) => state.loadAllotmentForCurrentUser
  )
  const setManualStartingAllotment = useAllotmentStore(
    (state) => state.setManualStartingAllotment
  )
  const setSetupMode = useAllotmentStore((state) => state.setSetupMode)
  const completeInitialSetup = useAllotmentStore(
    (state) => state.completeInitialSetup
  )

  const navigate = useNavigate()

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
  const [scanValidation, setScanValidation] =
    useState<ScanValidationResult | null>(null)

  const [showIntroPopup, setShowIntroPopup] = useState(true)
  const [currentAllotmentInput, setCurrentAllotmentInput] = useState("")
  const [introError, setIntroError] = useState("")

  const [showFinalConfirm, setShowFinalConfirm] = useState(false)
  const [finalConfirmMode, setFinalConfirmMode] =
    useState<FinalConfirmMode>(null)
  const [hasAcceptedFinalConfirm, setHasAcceptedFinalConfirm] = useState(false)
  const [savedPurchaseCount, setSavedPurchaseCount] = useState(0)
  const [isCompletingSetup, setIsCompletingSetup] = useState(false)

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
    if (!cameraActive) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [cameraActive])

  async function startCamera() {
    try {
      stopCamera()
      setCameraError("")
      setReceiptImage(null)
      setOcrImage(null)
      setScanStatus("")
      setScanValidation(null)

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
    setScanValidation(null)
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
        setScanValidation(null)
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
    event.target.value = ""
  }

  function clearImage() {
    setReceiptImage(null)
    setOcrImage(null)
    setCameraError("")
    setScanStatus("")
    setScanValidation(null)
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
      setScanValidation(null)

      const imageToScan = ocrImage || receiptImage

      const result = await Tesseract.recognize(imageToScan, "eng", {
        logger: (message) => {
          if (
            message.status === "recognizing text" &&
            typeof message.progress === "number"
          ) {
            setScanStatus(
              `Reading receipt... ${Math.round(message.progress * 100)}%`
            )
          }
        },
      })

      const parsed = parseReceiptText(result.data.text)
      const validation = validateParsedReceipt(parsed)

      setScanValidation(validation)

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

      if (validation.confidence === "high") {
        setScanStatus("Receipt scanned. Please review the details before saving.")
      } else if (validation.confidence === "medium") {
        setScanStatus(
          "Receipt partially scanned. Review flagged fields before saving."
        )
      } else {
        setScanStatus("Low-confidence scan. Please review all details carefully.")
      }
    } catch (error) {
      console.error("Receipt scan error:", error)
      setScanStatus("Unable to scan this receipt. Please enter details manually.")
      setScanValidation({
        confidence: "low",
        warnings: ["OCR could not confidently read this image."],
        missingFields: ["Dispensary", "Purchase Date", "Purchase Time", "Items"],
        detectedFields: {
          dispensary: false,
          purchaseDate: false,
          purchaseTime: false,
          items: false,
        },
        points: 0,
      })
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
    setItems([createEmptyItem()])
    setExpandedItemId(null)
    setReceiptImage(null)
    setOcrImage(null)
    setCameraError("")
    setScanStatus("")
    setScanValidation(null)
    stopCamera()
  }

  function openFinalConfirmation(mode: FinalConfirmMode) {
    setFinalConfirmMode(mode)
    setHasAcceptedFinalConfirm(false)
    setShowFinalConfirm(true)
  }

  function closeFinalConfirmation() {
    if (isCompletingSetup) return
    setShowFinalConfirm(false)
    setFinalConfirmMode(null)
    setHasAcceptedFinalConfirm(false)
  }

  function handleSaveIntroAllotment() {
    const trimmedValue = currentAllotmentInput.trim()

    if (!trimmedValue) {
      setIntroError("Please enter your current allotment before continuing.")
      return
    }

    const parsedValue = Number(trimmedValue)

    if (Number.isNaN(parsedValue) || parsedValue < 0) {
      setIntroError("Please enter a valid allotment amount.")
      return
    }

    setIntroError("")
    openFinalConfirmation("manual")
  }

  async function handleIntroAddPurchases() {
    try {
      setIsCompletingSetup(true)
      await setSetupMode("purchases")
      setIntroError("")
      setShowIntroPopup(false)
    } catch (error) {
      console.error("Failed to switch to purchase setup mode:", error)
      setIntroError("Unable to continue right now. Please try again.")
    } finally {
      setIsCompletingSetup(false)
    }
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

    try {
      setIsCompletingSetup(true)

      await addPurchase({
        id: crypto.randomUUID(),
        purchaseDate,
        purchaseTime,
        purchaseDateTime: buildPurchaseDateTime(purchaseDate, purchaseTime),
        dispensary,
        notes,
        source: receiptImage ? "scan" : "manual",
        countsTowardAllotment: true,
        entryMode: "setup",
        items: items.map((item) => ({
          id: item.id,
          productName: item.productName,
          category: item.category,
          grams: Number(item.grams),
        })),
      })

      setSavedPurchaseCount((current) => current + 1)
      resetForm()
    } catch (error) {
      console.error("Failed to save setup purchase:", error)
      alert("Unable to save this purchase right now.")
    } finally {
      setIsCompletingSetup(false)
    }
  }

  function handleFinishInitialSetup() {
    if (savedPurchaseCount < 1) {
      alert(
        "Please save at least one active purchase before completing setup, or return and enter your current allotment instead."
      )
      return
    }

    openFinalConfirmation("purchases")
  }

  async function handleConfirmCompleteSetup() {
    try {
      setIsCompletingSetup(true)

      if (finalConfirmMode === "manual") {
        const parsedValue = Number(currentAllotmentInput.trim())

        if (Number.isNaN(parsedValue) || parsedValue < 0) {
          setIntroError("Please enter a valid allotment amount.")
          closeFinalConfirmation()
          return
        }

        await setManualStartingAllotment(parsedValue)
        await completeInitialSetup()
        setShowIntroPopup(false)
        closeFinalConfirmation()
        navigate("/dashboard")
        return
      }

      if (finalConfirmMode === "purchases") {
        await setSetupMode("purchases")
        await completeInitialSetup()
        closeFinalConfirmation()
        navigate("/dashboard")
      }
    } catch (error) {
      console.error("Failed to complete initial setup:", error)
      alert("Unable to complete setup right now. Please try again.")
    } finally {
      setIsCompletingSetup(false)
    }
  }

  const finalConfirmMessage =
    finalConfirmMode === "manual"
      ? "Your starting allotment must be accurate from the beginning for BudBalance to calculate correctly. Incorrect information can cause inaccurate totals, timelines, and tracking."
      : "Your saved purchase information must be accurate from the beginning for BudBalance to calculate correctly. Incorrect information can cause inaccurate totals, timelines, and tracking."

  return (
    <>
      {showIntroPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                BudBalance
              </p>

              <h2 className="mt-2 text-lg font-semibold text-white">
                Initial Allotment Setup
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Enter any current purchases now for the most accurate tracking.
                If you want to skip this step for now, you must enter your current
                allotment now.
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Current Allotment
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={currentAllotmentInput}
                onChange={(e) => {
                  setCurrentAllotmentInput(e.target.value)
                  if (introError) setIntroError("")
                }}
                placeholder="Enter current allotment"
                disabled={isCompletingSetup}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              />

              {introError && (
                <p className="mt-2 text-sm text-red-300">{introError}</p>
              )}
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3">
              <button
                type="button"
                onClick={handleSaveIntroAllotment}
                disabled={isCompletingSetup}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save & Continue
              </button>

              <button
                type="button"
                onClick={handleIntroAddPurchases}
                disabled={isCompletingSetup}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCompletingSetup ? "Saving..." : "Add Purchases Instead"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showFinalConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 text-white shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                BudBalance
              </p>

              <h2 className="mt-2 text-lg font-semibold text-white">
                Verify Your Setup
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                {finalConfirmMessage}
              </p>
            </div>

            <label className="mt-5 flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-3">
              <input
                type="checkbox"
                checked={hasAcceptedFinalConfirm}
                onChange={(e) => setHasAcceptedFinalConfirm(e.target.checked)}
                disabled={isCompletingSetup}
                className="mt-1 h-4 w-4 rounded border-white/20 bg-slate-800 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm leading-5 text-slate-300">
                I confirm that I reviewed my information and understand that
                BudBalance depends on accurate setup data.
              </span>
            </label>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={closeFinalConfirmation}
                disabled={isCompletingSetup}
                className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Verify Information
              </button>

              <button
                type="button"
                disabled={!hasAcceptedFinalConfirm || isCompletingSetup}
                onClick={handleConfirmCompleteSetup}
                className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCompletingSetup ? "Completing..." : "Complete Setup"}
              </button>
            </div>
          </div>
        </div>
      )}

      {cameraActive && (
        <div className="fixed inset-0 z-[90] bg-black">
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/95 px-4 py-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                  Smart Scan
                </p>
                <h3 className="mt-1 text-sm font-semibold text-white">
                  Capture Receipt
                </h3>
              </div>

              <button
                type="button"
                onClick={stopCamera}
                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white transition hover:bg-white/10"
              >
                Close
              </button>
            </div>

            <div className="relative flex-1 overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-6">
                <div className="w-full max-w-md rounded-[2rem] border-2 border-emerald-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
                  <div className="aspect-[3/4] w-full" />
                </div>
              </div>

              <div className="pointer-events-none absolute inset-x-0 top-4 px-4">
                <div className="mx-auto max-w-md rounded-2xl bg-slate-950/75 px-4 py-3 text-center backdrop-blur">
                  <p className="text-sm font-semibold text-white">
                    Center the receipt in the frame
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Try to keep the whole receipt visible and reduce glare.
                  </p>
                </div>
              </div>

              <div className="absolute inset-x-0 bottom-0 border-t border-white/10 bg-slate-950/90 px-4 pb-6 pt-4 backdrop-blur">
                <div className="mx-auto max-w-md space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      disabled={isCompletingSetup}
                      className="rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Capture
                    </button>

                    <button
                      type="button"
                      onClick={stopCamera}
                      disabled={isCompletingSetup}
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Cancel
                    </button>
                  </div>

                  {cameraError && (
                    <p className="rounded-2xl border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-300">
                      {cameraError}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-black px-4 py-6 text-white">
        <div className="mx-auto w-full max-w-md space-y-4">
          <div className="rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.55)]">
            <div className="mb-5 text-center">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
                BudBalance
              </p>

              <h1 className="mt-2 text-lg font-semibold text-white">
                First-Time Allotment Setup
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Add any purchases that are still active in your current 30-day
                allotment window so BudBalance can calculate your available grams
                and return dates correctly.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                    disabled={isCompletingSetup}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span aria-hidden="true">📷</span>
                    <span>Camera</span>
                  </button>

                  <label className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60">
                    <span aria-hidden="true">📁</span>
                    <span>Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isCompletingSetup}
                      className="hidden"
                    />
                  </label>
                </div>

                {cameraError && !cameraActive && (
                  <p className="mt-3 rounded-2xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
                    {cameraError}
                  </p>
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
                        disabled={isScanning || isCompletingSetup}
                        className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isScanning ? "Scanning..." : "Scan Receipt"}
                      </button>

                      <button
                        type="button"
                        onClick={clearImage}
                        disabled={isCompletingSetup}
                        className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove Image
                      </button>
                    </div>

                    {scanStatus && (
                      <p className="rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                        {scanStatus}
                      </p>
                    )}

                    {scanValidation && (
                      <div
                        className={`rounded-2xl border px-3 py-3 ${getValidationCardClasses(
                          scanValidation.confidence
                        )}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold">
                              {getValidationTitle(scanValidation.confidence)}
                            </p>
                            <p className="mt-1 text-xs opacity-90">
                              {getValidationDescription(scanValidation)}
                            </p>
                          </div>

                          <div className="shrink-0 rounded-xl border border-white/10 bg-black/10 px-2.5 py-2 text-right">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Score
                            </p>
                            <p className="mt-1 text-sm font-semibold">
                              {scanValidation.points ?? 0}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Dispensary
                            </p>
                            <p className="mt-1 font-semibold">
                              {scanValidation.detectedFields.dispensary
                                ? "Found"
                                : "Missing"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Date
                            </p>
                            <p className="mt-1 font-semibold">
                              {scanValidation.detectedFields.purchaseDate
                                ? "Found"
                                : "Missing"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Time
                            </p>
                            <p className="mt-1 font-semibold">
                              {scanValidation.detectedFields.purchaseTime
                                ? "Found"
                                : "Missing"}
                            </p>
                          </div>

                          <div className="rounded-xl border border-white/10 bg-black/10 px-2 py-2">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Items
                            </p>
                            <p className="mt-1 font-semibold">
                              {scanValidation.detectedFields.items
                                ? "Found"
                                : "Missing"}
                            </p>
                          </div>
                        </div>

                        {scanValidation.missingFields.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Missing Fields
                            </p>
                            <ul className="mt-1 space-y-1 text-xs">
                              {scanValidation.missingFields.map((field: string) => (
                                <li key={field}>• {field}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {scanValidation.warnings.length > 0 && (
                          <div className="mt-3">
                            <p className="text-[10px] uppercase tracking-wide opacity-75">
                              Warnings
                            </p>
                            <ul className="mt-1 space-y-1 text-xs">
                              {scanValidation.warnings.map((warning: string) => (
                                <li key={warning}>• {warning}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
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
                        disabled={isCompletingSetup}
                        className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isCompletingSetup}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isCompletingSetup}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isCompletingSetup}
                          className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                        disabled={isCompletingSetup}
                        className="mb-2 w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                      disabled={isCompletingSetup}
                      className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                      disabled={isCompletingSetup}
                      className="w-full resize-none overflow-hidden rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                          disabled={isCompletingSetup}
                          className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
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
                                  disabled={isCompletingSetup}
                                  className="rounded-xl border border-red-500/20 bg-red-500/10 px-2.5 py-1.5 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    disabled={isCompletingSetup}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                                  disabled={isCompletingSetup}
                                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    disabled={isCompletingSetup}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                                    disabled={isCompletingSetup}
                                    className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                    disabled={isCompletingSetup}
                    className="w-full rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-3 text-sm font-semibold text-emerald-400 transition hover:bg-emerald-500/15 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    + Add Item
                  </button>
                </div>
              </div>

              <canvas ref={canvasRef} className="hidden" />

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isCompletingSetup}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompletingSetup ? "Saving..." : "Save Active Purchase"}
                </button>

                <button
                  type="button"
                  onClick={handleFinishInitialSetup}
                  disabled={isCompletingSetup}
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCompletingSetup ? "Saving..." : "Complete Setup"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}