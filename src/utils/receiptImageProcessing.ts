import cv from "@techstark/opencv-js"

function isOpenCvReady() {
  return Boolean(cv && typeof cv.imread === "function")
}

function computeWhitePixelRatio(mat: any) {
  const nonZero = cv.countNonZero(mat)
  return nonZero / (mat.rows * mat.cols)
}

function isReasonableBinaryRatio(ratio: number) {
  return ratio > 0.18 && ratio < 0.96
}

export function preprocessCanvasImage(canvas: HTMLCanvasElement) {
  if (!isOpenCvReady()) return

  const src = cv.imread(canvas)
  const gray = new cv.Mat()
  const normalized = new cv.Mat()
  const denoised = new cv.Mat()
  const sharpened = new cv.Mat()
  const binaryOtsu = new cv.Mat()
  const adaptive = new cv.Mat()
  const morphOtsu = new cv.Mat()
  const morphAdaptive = new cv.Mat()

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
      binaryOtsu,
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

    const morphKernel = cv.getStructuringElement(
      cv.MORPH_RECT,
      new cv.Size(2, 2)
    )

    cv.morphologyEx(
      binaryOtsu,
      morphOtsu,
      cv.MORPH_OPEN,
      morphKernel,
      new cv.Point(-1, -1),
      1
    )

    cv.morphologyEx(
      adaptive,
      morphAdaptive,
      cv.MORPH_OPEN,
      morphKernel,
      new cv.Point(-1, -1),
      1
    )

    const otsuRatio = computeWhitePixelRatio(binaryOtsu)
    const adaptiveRatio = computeWhitePixelRatio(adaptive)
    const morphOtsuRatio = computeWhitePixelRatio(morphOtsu)
    const morphAdaptiveRatio = computeWhitePixelRatio(morphAdaptive)

    let output = binaryOtsu

    if (
      isReasonableBinaryRatio(morphAdaptiveRatio) &&
      !isReasonableBinaryRatio(morphOtsuRatio)
    ) {
      output = morphAdaptive
    } else if (
      isReasonableBinaryRatio(morphOtsuRatio) &&
      !isReasonableBinaryRatio(morphAdaptiveRatio)
    ) {
      output = morphOtsu
    } else if (
      isReasonableBinaryRatio(adaptiveRatio) &&
      (otsuRatio <= 0.12 || otsuRatio >= 0.98)
    ) {
      output = morphAdaptiveRatio >= 0.15 ? morphAdaptive : adaptive
    } else if (isReasonableBinaryRatio(morphOtsuRatio)) {
      output = morphOtsu
    } else if (isReasonableBinaryRatio(morphAdaptiveRatio)) {
      output = morphAdaptive
    } else if (isReasonableBinaryRatio(adaptiveRatio)) {
      output = adaptive
    }

    cv.imshow(canvas, output)

    sharpenKernel.delete()
    morphKernel.delete()
  } finally {
    src.delete()
    gray.delete()
    normalized.delete()
    denoised.delete()
    sharpened.delete()
    binaryOtsu.delete()
    adaptive.delete()
    morphOtsu.delete()
    morphAdaptive.delete()
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
    return sourceCanvas.toDataURL("image/png")
  }

  return tempCanvas.toDataURL("image/png")
}