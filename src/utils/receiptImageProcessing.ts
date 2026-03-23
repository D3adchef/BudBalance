import cv from "@techstark/opencv-js"

export function preprocessCanvasImage(canvas: HTMLCanvasElement) {
  const src = cv.imread(canvas)
  const gray = new cv.Mat()
  const normalized = new cv.Mat()
  const blurred = new cv.Mat()
  const thresholded = new cv.Mat()

  try {
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0)
    cv.normalize(gray, normalized, 0, 255, cv.NORM_MINMAX)
    cv.GaussianBlur(
      normalized,
      blurred,
      new cv.Size(3, 3),
      0,
      0,
      cv.BORDER_DEFAULT
    )
    cv.threshold(
      blurred,
      thresholded,
      0,
      255,
      cv.THRESH_BINARY + cv.THRESH_OTSU
    )
    cv.imshow(canvas, thresholded)
  } finally {
    src.delete()
    gray.delete()
    normalized.delete()
    blurred.delete()
    thresholded.delete()
  }
}

export function buildProcessedImageFromCanvas(sourceCanvas: HTMLCanvasElement) {
  const tempCanvas = document.createElement("canvas")
  tempCanvas.width = sourceCanvas.width
  tempCanvas.height = sourceCanvas.height

  const tempContext = tempCanvas.getContext("2d")
  if (!tempContext) return null

  tempContext.drawImage(sourceCanvas, 0, 0)
  preprocessCanvasImage(tempCanvas)

  return tempCanvas.toDataURL("image/png")
}