import { useEffect, useRef, useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { usePurchaseStore } from "../features/purchases/purchaseStore"

export default function AddPurchasePage() {
  const addPurchase = usePurchaseStore((state) => state.addPurchase)
  const navigate = useNavigate()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const [productName, setProductName] = useState("")
  const [grams, setGrams] = useState("")
  const [dispensary, setDispensary] = useState("")
  const [notes, setNotes] = useState("")
  const [purchaseDate, setPurchaseDate] = useState("")

  const [receiptImage, setReceiptImage] = useState<string | null>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState("")
  const [stream, setStream] = useState<MediaStream | null>(null)

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

  async function startCamera() {
    try {
      stopCamera()
      setCameraError("")
      setReceiptImage(null)

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

    const imageDataUrl = canvas.toDataURL("image/png")
    setReceiptImage(imageDataUrl)
    setCameraError("")
    stopCamera()
  }

  function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onloadend = () => {
      setReceiptImage(reader.result as string)
      setCameraError("")
      stopCamera()
    }

    reader.readAsDataURL(file)
  }

  function clearImage() {
    setReceiptImage(null)
    setCameraError("")
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!productName || !grams || !purchaseDate) {
      alert("Please complete Product Name, Grams, and Purchase Date.")
      return
    }

    addPurchase({
      id: crypto.randomUUID(),
      productName,
      grams: Number(grams),
      dispensary,
      notes,
      purchaseDate,
      source: receiptImage ? "scan" : "manual",
    })

    setProductName("")
    setGrams("")
    setDispensary("")
    setNotes("")
    setPurchaseDate("")
    setReceiptImage(null)
    setCameraError("")
    stopCamera()

    navigate("/purchase-history")
  }

  return (
    <div className="space-y-4">
      <div className="px-1">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-emerald-400">
          BudBalance
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">Add Purchase</h2>
        <p className="mt-1 text-xs text-slate-400">
          Capture a receipt or enter purchase details manually.
        </p>
      </div>

      <div className="space-y-4 rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Smart Scan</h3>
            <p className="mt-1 text-xs leading-5 text-slate-400">
              Use your camera or upload a receipt/package photo, then confirm
              the details below.
            </p>
          </div>

          <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
            Optional
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
          >
            Use Camera
          </button>

          <label className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-white/10">
            Upload File
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        </div>

        {cameraError && (
          <p className="rounded-2xl border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
            {cameraError}
          </p>
        )}

        {cameraActive && (
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-3">
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
          <div className="space-y-3 rounded-2xl border border-white/10 bg-slate-950 p-3">
            <img
              src={receiptImage}
              alt="Receipt preview"
              className="w-full rounded-2xl border border-white/10"
            />

            <button
              type="button"
              onClick={clearImage}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Remove Image
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="rounded-3xl border border-white/10 bg-slate-900/90 p-4 shadow-lg shadow-black/20">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-white">
              Purchase Details
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Required fields: product name, grams, and purchase date.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Product Name
              </label>
              <input
                placeholder="Enter product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Grams
                </label>
                <input
                  placeholder="0.0"
                  type="number"
                  value={grams}
                  onChange={(e) => setGrams(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                />
              </div>

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
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-slate-400">
                Dispensary
              </label>
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
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-800/90 px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-500"
                rows={3}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-2xl bg-emerald-600 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-emerald-500 active:scale-[0.98]"
        >
          Save Purchase
        </button>
      </form>
    </div>
  )
}