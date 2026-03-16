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
    <div className="space-y-6">
      <div>
        <p className="text-sm text-slate-400">BudBalance</p>
        <h2 className="mt-1 text-xl font-semibold text-white">Add Purchase</h2>
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div>
          <h3 className="text-base font-semibold text-white">Smart Scan</h3>
          <p className="mt-1 text-sm text-slate-400">
            Use your camera or upload a receipt/package photo, then confirm the
            purchase details below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={startCamera}
            className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Use Camera
          </button>

          <label className="cursor-pointer rounded-xl bg-slate-800 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-slate-700">
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
          <p className="rounded-xl border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
            {cameraError}
          </p>
        )}

        {cameraActive && (
          <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <div className="overflow-hidden rounded-xl border border-slate-700 bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="block w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={capturePhoto}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                Capture Photo
              </button>

              <button
                type="button"
                onClick={stopCamera}
                className="rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Cancel Camera
              </button>
            </div>
          </div>
        )}

        {receiptImage && (
          <div className="space-y-3 rounded-2xl border border-slate-700 bg-slate-950 p-3">
            <img
              src={receiptImage}
              alt="Receipt preview"
              className="w-full rounded-xl border border-slate-700"
            />

            <button
              type="button"
              onClick={clearImage}
              className="w-full rounded-xl bg-slate-800 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Remove Image
            </button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="Product Name"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-800 p-3 text-white outline-none focus:border-emerald-500"
        />

        <input
          placeholder="Grams"
          type="number"
          value={grams}
          onChange={(e) => setGrams(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-800 p-3 text-white outline-none focus:border-emerald-500"
        />

        <input
          placeholder="Dispensary"
          value={dispensary}
          onChange={(e) => setDispensary(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-800 p-3 text-white outline-none focus:border-emerald-500"
        />

        <input
          type="date"
          value={purchaseDate}
          onChange={(e) => setPurchaseDate(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-800 p-3 text-white outline-none focus:border-emerald-500"
        />

        <textarea
          placeholder="Notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full rounded-xl border border-slate-800 bg-slate-800 p-3 text-white outline-none focus:border-emerald-500"
          rows={4}
        />

        <button
          type="submit"
          className="w-full rounded-xl bg-emerald-600 p-3 font-semibold text-white transition hover:bg-emerald-500"
        >
          Save Purchase
        </button>
      </form>
    </div>
  )
}