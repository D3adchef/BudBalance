import cv from "@techstark/opencv-js"

function isOpenCvReady() {
  return Boolean(cv && typeof cv.imread === "function")
}

export function preprocessCanvasImage(canvas: HTMLCanvasElement) {
  if (!isOpenCvReady()) return

  const src = cv.imread(canvas)
  const gray = new cv.Mat()
  const normalized = new cv.Mat()
  const denoised = new cv.Mat()
  const sharpened = new cv.Mat()
  const binary = new cv.Mat()
  const adaptive = new cv.Mat()

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0)

    cv.normalize(gray, normalized, 0, 255, cv.NORM_MINMAX)

    cv.GaussianBlur(
      normalized,
      denoised,
      new cv.Size(3, 3),
      0,
      0,
      cv.BORDER_DEFAULT
    )

    const sharpenKernel = cv.matFromArray(3, 3, cv.CV_32F, [
      0, -1, 0,
      -1, 5, -1,
      0, -1, 0,
    ])

    cv.filter2D(
      denoised,
      sharpened,
      -1,
      sharpenKernel,
      new cv.Point(-1, -1),
      0,
      cv.BORDER_DEFAULT
    )

    cv.threshold(
      sharpened,
      binary,
      0,
      255,
      cv.THRESH_BINARY + cv.THRESH_OTSU
    )

    cv.adaptiveThreshold(
      sharpened,
      adaptive,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      19,
      8
    )

    const binaryNonZero = cv.countNonZero(binary)
    const adaptiveNonZero = cv.countNonZero(adaptive)

    const binaryRatio = binaryNonZero / (binary.rows * binary.cols)
    const adaptiveRatio = adaptiveNonZero / (adaptive.rows * adaptive.cols)

    const useAdaptive =
      adaptiveRatio > 0.2 &&
      adaptiveRatio < 0.95 &&
      (binaryRatio <= 0.12 || binaryRatio >= 0.98)

    cv.imshow(canvas, useAdaptive ? adaptive : binary)

    sharpenKernel.delete()
  } finally {
    src.delete()
    gray.delete()
    normalized.delete()
    denoised.delete()
    sharpened.delete()
    binary.delete()
    adaptive.delete()
  }
}

export function buildProcessedImageFromCanvas(sourceCanvas: HTMLCanvasElement) {
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = sourceCanvas.width
  tempCanvas.height = sourceCanvas.height

  const tempContext = tempCanvas.getContext("2d")
  if (!tempContext) return null

  tempContext.drawImage(sourceCanvas, 0, 0)

  try {
    preprocessCanvasImage(tempCanvas)
  } catch (error) {
    console.error("OpenCV preprocessing failed:", error)
  }

  return tempCanvas.toDataURL("image/png")
}