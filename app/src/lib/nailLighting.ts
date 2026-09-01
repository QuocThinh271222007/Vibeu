import { imageToLocal } from '@/lib/geometry'
import { getHandData, handBaseUrl } from '@/data/loaders'
import type { FingerId, NailCoord, SkinToneId } from '@/types/vibeu'

/**
 * Per-nail baked geometry — the single authoritative source every shading
 * pass (paint, decal warp, clear coat, debug views) reads from. Built once
 * per (skin tone, finger) and cached; never recomputed independently inside
 * individual render branches.
 *
 * `normal`/`curve` are a SIMULATED macro surface normal derived from the
 * real photographic mask's own width profile — not a measured/scanned
 * normal map. `light`/`spec` are derived from the real photo's luminance.
 * `edge` is a cheap chamfer distance-to-boundary field used for restrained
 * cuticle/contact shading. `photoAmbient`/`photoTint` are a heuristic
 * estimate of the local skin lighting sampled from the pixels immediately
 * around the nail, not a real inverse-rendering solve.
 */
export interface PreparedNail {
  id: FingerId
  x: number
  y: number
  w: number
  h: number
  alpha: Uint8ClampedArray
  uv: Float32Array // w*h*2, normalized (u across width, v cuticle->tip)
  normal: Float32Array // w*h*3, macro surface normal (image-space xyz, simulated)
  curve: Float32Array // w*h, signed curvature term in [-0.5, 0.5]; the same value that drives `normal`, reused by decal warp
  edge: Float32Array // w*h, 0 at the mask boundary rising to 1 a few px inside
  light: Float32Array // w*h, luminance-derived shading multiplier from the real photo
  spec: Float32Array // w*h, specular baseline from the real photo's highlights
  source: Uint8ClampedArray // w*h*4, original photo pixels for this nail's bbox
  photoAmbient: number // ~0.6-1.3, ambient brightness estimated from the skin around this nail
  photoTint: [number, number, number] // normalized (mean-1) warm/cool tint estimated from the same skin sample
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

/** Two-pass chamfer distance transform: 0 outside the mask, rising with distance inside it. */
function chamferDistanceInside(alpha: Uint8ClampedArray, w: number, h: number): Float32Array {
  const INF = 1e6
  const d = new Float32Array(w * h)
  for (let k = 0; k < w * h; k++) d[k] = alpha[k] >= 128 ? INF : 0

  const at = (xx: number, yy: number) => (xx < 0 || yy < 0 || xx >= w || yy >= h ? INF : d[yy * w + xx])

  for (let yy = 0; yy < h; yy++) {
    for (let xx = 0; xx < w; xx++) {
      const k = yy * w + xx
      if (d[k] === 0) continue
      d[k] = Math.min(d[k], at(xx - 1, yy) + 1, at(xx, yy - 1) + 1, at(xx - 1, yy - 1) + 1.4, at(xx + 1, yy - 1) + 1.4)
    }
  }
  for (let yy = h - 1; yy >= 0; yy--) {
    for (let xx = w - 1; xx >= 0; xx--) {
      const k = yy * w + xx
      if (d[k] === 0) continue
      d[k] = Math.min(d[k], at(xx + 1, yy) + 1, at(xx, yy + 1) + 1, at(xx + 1, yy + 1) + 1.4, at(xx - 1, yy + 1) + 1.4)
    }
  }
  return d
}

const EDGE_RADIUS_PX = 2.2

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
  const curve = new Float32Array(w * h)
  const light = new Float32Array(w * h)
  const spec = new Float32Array(w * h)
  const source = new Uint8ClampedArray(w * h * 4)
  const rowOf = new Int16Array(w * h)

  const rows = 100
  const lo = new Float32Array(rows).fill(1)
  const hi = new Float32Array(rows).fill(0)
  const lums: number[] = []

  // Skin-lighting sample ring: pixels outside the mask but within a padded
  // box around it, used to heuristically estimate the local photo lighting.
  const pad = Math.round(Math.max(w, h) * 0.35)
  const sx0 = Math.max(0, x - pad)
  const sy0 = Math.max(0, y - pad)
  const sx1 = Math.min(fullImage.width - 1, x + w + pad)
  const sy1 = Math.min(fullImage.height - 1, y + h + pad)
  let skinR = 0
  let skinG = 0
  let skinB = 0
  let skinN = 0
  for (let sy = sy0; sy < sy1; sy += 3) {
    for (let sx = sx0; sx < sx1; sx += 3) {
      const insideBbox = sx >= x && sx < x + w && sy >= y && sy < y + h
      if (insideBbox) {
        const mi = (sy - y) * w + (sx - x)
        if (maskAlpha[mi * 4 + 3] >= 128) continue // skip nail pixels, we only want skin
      }
      const idx = (sy * fullImage.width + sx) * 4
      skinR += fullImage.data[idx]
      skinG += fullImage.data[idx + 1]
      skinB += fullImage.data[idx + 2]
      skinN++
    }
  }
  const avgR = skinN ? skinR / skinN / 255 : 0.6
  const avgG = skinN ? skinG / skinN / 255 : 0.5
  const avgB = skinN ? skinB / skinN / 255 : 0.45
  const avgLum = avgR * 0.2126 + avgG * 0.7152 + avgB * 0.0722
  const photoAmbient = Math.min(1.3, Math.max(0.62, avgLum / 0.5))
  const tintLum = (avgR + avgG + avgB) / 3 || 1
  const photoTint: [number, number, number] = [avgR / tintLum, avgG / tintLum, avgB / tintLum]

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
    const c = rel - 0.5 // signed curvature term, shared by paint bump + decal warp
    curve[k] = c
    const nx = c * 1.72
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

  const dist = chamferDistanceInside(alpha, w, h)
  const edge = new Float32Array(w * h)
  for (let k = 0; k < w * h; k++) edge[k] = clamp01(dist[k] / EDGE_RADIUS_PX)

  return { id: nail.id, x, y, w, h, alpha, uv, normal, curve, edge, light, spec, source, photoAmbient, photoTint }
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
