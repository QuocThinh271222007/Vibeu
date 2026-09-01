import { imageToLocal } from '@/lib/geometry'
import { getHandData, handBaseUrl } from '@/data/loaders'
import type { FingerId, NailCoord, SkinToneId } from '@/types/vibeu'

/**
 * Per-nail baked geometry used for lit rendering: the real photographic mask
 * (rasterized from the same `nail.path` the SVG clip uses, so paint can never
 * drift off the real nail) plus a synthetic surface normal derived from the
 * mask's own width profile along the nail's rotated uvFrame axes. Deriving the
 * normal this way means lighting is automatically correct for tilted fingers
 * (thumb/ring/little) without any per-finger special-casing.
 */
export interface PreparedNail {
  id: FingerId
  x: number
  y: number
  w: number
  h: number
  alpha: Uint8ClampedArray
  uv: Float32Array // w*h*2, normalized (u across width, v cuticle->tip)
  normal: Float32Array // w*h*3
  light: Float32Array // w*h, luminance-derived shading multiplier from the real photo
  spec: Float32Array // w*h, specular baseline from the real photo's highlights
  source: Uint8ClampedArray // w*h*4, original photo pixels for this nail's bbox
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

export function prepareNail(nail: NailCoord, fullImage: ImageData): PreparedNail {
  const x = Math.round(nail.bbox[0])
  const y = Math.round(nail.bbox[1])
  const w = Math.round(nail.bbox[2])
  const h = Math.round(nail.bbox[3])

  const maskCanvas = document.createElement('canvas')
  maskCanvas.width = w
  maskCanvas.height = h
  const mctx = maskCanvas.getContext('2d')!
  mctx.translate(-x, -y)
  mctx.fillStyle = '#fff'
  mctx.fill(new Path2D(nail.path))
  const maskAlpha = mctx.getImageData(0, 0, w, h).data

  const alpha = new Uint8ClampedArray(w * h)
  const uv = new Float32Array(w * h * 2)
  const normal = new Float32Array(w * h * 3)
  const light = new Float32Array(w * h)
  const spec = new Float32Array(w * h)
  const source = new Uint8ClampedArray(w * h * 4)
  const rowOf = new Int16Array(w * h)

  const rows = 100
  const lo = new Float32Array(rows).fill(1)
  const hi = new Float32Array(rows).fill(0)
  const lums: number[] = []

  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const k = yy * w + xx
      const a = maskAlpha[k * 4 + 3]
      alpha[k] = a
      const fx = Math.min(fullImage.width - 1, x + xx)
      const fy = Math.min(fullImage.height - 1, y + yy)
      const [u, v] = imageToLocal(nail, [fx, fy])
      uv[k * 2] = u
      uv[k * 2 + 1] = v
      const srcIdx = (fy * fullImage.width + fx) * 4
      const r = fullImage.data[srcIdx]
      const g = fullImage.data[srcIdx + 1]
      const b = fullImage.data[srcIdx + 2]
      source[k * 4] = r
      source[k * 4 + 1] = g
      source[k * 4 + 2] = b
      source[k * 4 + 3] = a
      if (a < 128) {
        rowOf[k] = -1
        continue
      }
      lums.push((r * 0.2126 + g * 0.7152 + b * 0.0722) / 255)
      const row = Math.min(rows - 1, Math.max(0, Math.round(clamp01(v) * (rows - 1))))
      rowOf[k] = row
      if (u < lo[row]) lo[row] = u
      if (u > hi[row]) hi[row] = u
    }
  }

  lums.sort((a, b) => a - b)
  const median = lums.length ? lums[Math.floor(lums.length * 0.55)] : 0.5
  const [ux, uy] = nail.uvFrame.u
  const [vx, vy] = nail.uvFrame.v

  for (let k = 0; k < w * h; k++) {
    if (alpha[k] < 128) continue
    const u = uv[k * 2]
    const v = uv[k * 2 + 1]
    const row = rowOf[k]
    const rel = clamp01((u - lo[row]) / (hi[row] - lo[row] || 1))
    const nx = (rel - 0.5) * 1.72
    const ny = (v - 0.5) * 0.65
    const nz = Math.sqrt(Math.max(0.08, 1 - nx * nx - ny * ny))
    const n = norm3([nx * ux + ny * vx, nx * uy + ny * vy, nz])
    normal[k * 3] = n[0]
    normal[k * 3 + 1] = n[1]
    normal[k * 3 + 2] = n[2]
    const r = source[k * 4]
    const g = source[k * 4 + 1]
    const b = source[k * 4 + 2]
    const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
    light[k] = Math.min(1.08, Math.max(0.55, 0.7 + 0.31 * n[2] + (lum / median - 1) * 0.17))
    spec[k] = clamp01((lum - median * 0.98) / (1 - median + 0.001))
  }

  return { id: nail.id, x, y, w, h, alpha, uv, normal, light, spec, source }
}

function loadImagePixels(tone: SkinToneId, width: number, height: number): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.decoding = 'sync'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, width, height)
      resolve(ctx.getImageData(0, 0, width, height))
    }
    img.onerror = () => reject(new Error(`Failed to load ${handBaseUrl(tone)}`))
    img.src = handBaseUrl(tone)
  })
}

const preparedCache = new Map<SkinToneId, Promise<Map<FingerId, PreparedNail>>>()

/**
 * Resolves the hand's own coordinates.json internally (via the same cached
 * fetch `useHandData` uses) instead of trusting a `hand` object passed in from
 * a component render — the caller's `hand` prop can still reflect the
 * previous skin tone for a render or two after `tone` has already switched
 * (its fetch resolves asynchronously), and baking that stale geometry into
 * this cache under the new tone's key would corrupt every nail permanently
 * for that tone until reload.
 */
export function getPreparedHand(tone: SkinToneId): Promise<Map<FingerId, PreparedNail>> {
  let cached = preparedCache.get(tone)
  if (!cached) {
    cached = getHandData(tone).then((hand) =>
      loadImagePixels(tone, hand.width, hand.height).then((pixels) => {
        const map = new Map<FingerId, PreparedNail>()
        for (const nail of hand.nails) map.set(nail.id, prepareNail(nail, pixels))
        return map
      }),
    )
    preparedCache.set(tone, cached)
  }
  return cached
}
