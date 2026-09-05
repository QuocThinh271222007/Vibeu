import { imageToLocal } from '@/lib/geometry'
import { getHandData, handBaseUrl } from '@/data/loaders'
import { maskGrowPxFor } from '@/lib/nailEdgeTuning'
import type { FingerId, NailCoord, NailLength, NailShape, SkinToneId } from '@/types/vibeu'

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
  source: Uint8ClampedArray // w*h*4, original photo detail normalized to a neutral nail substrate
  photoAmbient: number // ~0.75-1.3, ambient brightness estimated from the skin around this nail
  photoTint: [number, number, number] // normalized (mean-1) warm/cool tint estimated from the same skin sample
}

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}

function smoothstep(a: number, b: number, v: number): number {
  const t = clamp01((v - a) / Math.max(1e-6, b - a))
  return t * t * (3 - 2 * t)
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

const EDGE_RADIUS_PX = 1.6

export function prepareNail(
  nail: NailCoord,
  fullImage: ImageData,
  tone?: SkinToneId,
  photoShape?: NailShape,
  photoLength?: NailLength,
): PreparedNail {
  // MASK_GROW_PX (nailEdgeTuning.ts) shifts the coverage ramp outward past the traced
  // path's own boundary. Without padding, the working buffer below is sized to the exact
  // traced bbox, so growth on any side where the path already sits close to that bbox edge
  // has nowhere to go and gets hard-clipped by the array bound — visible as a flat, unnatural
  // cut through the paint rather than a smooth outward extension. Padding the buffer by the
  // grow amount (plus slack) gives the chamfer distance field and photo sampling real room.
  const growPx = maskGrowPxFor(tone, nail.id, photoShape, photoLength)
  const bufPad = growPx > 0 ? Math.ceil(growPx) + 4 : 0
  const rawX = Math.round(nail.bbox[0])
  const rawY = Math.round(nail.bbox[1])
  const rawX1 = rawX + Math.round(nail.bbox[2])
  const rawY1 = rawY + Math.round(nail.bbox[3])
  const x = Math.max(0, rawX - bufPad)
  const y = Math.max(0, rawY - bufPad)
  const w = Math.min(fullImage.width, rawX1 + bufPad) - x
  const h = Math.min(fullImage.height, rawY1 + bufPad) - y

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
        if (maskAlpha[mi * 4 + 3] >= 128) continue
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
  const photoAmbient = Math.min(1.22, Math.max(0.78, avgLum / 0.5))
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
      // `row` is purely a function of v (cuticle->tip position), independent of alpha, so
      // it's always assigned — growth-band pixels just outside the traced path (see
      // MASK_GROW_PX) still need a row to look up later. Only the per-row u-extent
      // stats (lo/hi) and luminance sample are restricted to genuinely-traced pixels.
      const row = Math.min(rows - 1, Math.max(0, Math.round(clamp01(v) * (rows - 1))))
      rowOf[k] = row
      if (a < 128) continue
      lums.push((r * 0.2126 + g * 0.7152 + b * 0.0722) / 255)
      if (u < lo[row]) lo[row] = u
      if (u > hi[row]) hi[row] = u
    }
  }

  lums.sort((a, b) => a - b)
  const median = lums.length ? lums[Math.floor(lums.length * 0.55)] : 0.5
  const [ux, uy] = nail.uvFrame.u
  const [vx, vy] = nail.uvFrame.v

  // Two-sided signed distance to the TRACED path boundary: positive inside (as before),
  // negative outside. `growPx` (see nailEdgeTuning.ts) shifts the coverage ramp outward
  // by this many pixels for specific finger/tone combinations where the traced path sits
  // measurably inside the real photographed nail's own edge — confirmed empirically:
  // shrinking the inward blend feather to near-zero left the same visible sliver of real,
  // unpainted nail in the same place, which rules out blending and means the path itself
  // needs to reach further. This only helps if HandCanvas's live clip-path and
  // exportImage's canvas clip grow by the same amount — see nailEdgeTuning.ts.
  const insideDist = chamferDistanceInside(alpha, w, h)
  const invertedAlpha = new Uint8ClampedArray(w * h)
  for (let k = 0; k < w * h; k++) invertedAlpha[k] = alpha[k] < 128 ? 255 : 0
  const outsideDist = chamferDistanceInside(invertedAlpha, w, h)
  const signedDist = new Float32Array(w * h)
  for (let k = 0; k < w * h; k++) signedDist[k] = alpha[k] >= 128 ? insideDist[k] : -outsideDist[k]

  for (let k = 0; k < w * h; k++) {
    // Skip only pixels that will end up with ~0 coverage even after growth — everything
    // else (the original mask plus the grown band around it) needs real normal/curve/
    // light data, not the zero-initialized default, or it would render as a flat black gap.
    if (signedDist[k] < 0.65 - growPx - 1.5) continue
    const u = uv[k * 2]
    const v = uv[k * 2 + 1]
    const row = rowOf[k]
    const rowValid = lo[row] <= hi[row]
    const rel = rowValid ? clamp01((u - lo[row]) / (hi[row] - lo[row] || 1)) : 0.5
    const c = rel - 0.5
    curve[k] = c
    const nx = c * 1.56
    const ny = (v - 0.5) * 0.5
    const nz = Math.sqrt(Math.max(0.12, 1 - nx * nx - ny * ny))
    const n = norm3([nx * ux + ny * vx, nx * uy + ny * vy, nz])
    normal[k * 3] = n[0]
    normal[k * 3 + 1] = n[1]
    normal[k * 3 + 2] = n[2]
    const r = source[k * 4]
    const g = source[k * 4 + 1]
    const b = source[k * 4 + 2]
    const lum = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255
    light[k] = Math.min(1.06, Math.max(0.72, 0.78 + 0.23 * n[2] + (lum / median - 1) * 0.11))
    spec[k] = clamp01((lum - median * 0.99) / (1 - median + 0.001))

    // For translucent/jelly materials the compositor mixes the pigment with
    // `source`. Feeding the literal RGB from the photo made deep side-lighting
    // and nearby skin/shadow contamination turn some nails grey/brown. Keep
    // the real photographic *luminance detail* but normalize chroma to a
    // neutral natural-nail substrate, so translucent polish still feels
    // photographic without inheriting unrelated colour casts.
    const detail = Math.min(1.08, Math.max(0.82, lum / Math.max(0.001, median)))
    source[k * 4] = Math.round(255 * Math.min(1, 0.95 * detail))
    source[k * 4 + 1] = Math.round(255 * Math.min(1, 0.92 * detail))
    source[k * 4 + 2] = Math.round(255 * Math.min(1, 0.9 * detail))
  }

  const edge = new Float32Array(w * h)
  const featherPx = Math.max(4.5, Math.min(w, h) * 0.035)
  // Same ramp width as the original inward-only feather, just both bounds shifted
  // outward by growPx — when growPx is 0 this reduces exactly to the original
  // `smoothstep(0.65, featherPx, dist)` behaviour (dist === signedDist for inside pixels,
  // and outside pixels were already forced to 0 either way).
  const rampLo = 0.65 - growPx
  const rampHi = featherPx - growPx
  for (let k = 0; k < w * h; k++) {
    // The authored SVG paths intentionally err slightly inside/outside the real nail
    // bed. A soft coverage ramp (optionally grown outward per nailEdgeTuning.ts) hides
    // that registration error by fading paint back to the real photo instead of a hard
    // cutoff, instead of drawing a hard outline or leaving a visible unpainted rim.
    const coverage = smoothstep(rampLo, rampHi, signedDist[k])
    alpha[k] = Math.round(255 * coverage)
    source[k * 4 + 3] = alpha[k]
    edge[k] = clamp01(signedDist[k] / EDGE_RADIUS_PX)
  }

  return { id: nail.id, x, y, w, h, alpha, uv, normal, curve, edge, light, spec, source, photoAmbient, photoTint }
}

function loadImagePixels(url: string, width: number, height: number): Promise<ImageData> {
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
    img.onerror = () => reject(new Error(`Failed to load ${url}`))
    img.src = url
  })
}

const preparedCache = new Map<string, Promise<Map<FingerId, PreparedNail>>>()

/**
 * Resolves the hand's own coordinates.json internally (via the same cached
 * fetch `useHandData` uses) instead of trusting a `hand` object passed in from
 * a component render — the caller's `hand` prop can still reflect the
 * previous skin tone/shape/length for a render or two after they've already
 * switched (the fetch resolves asynchronously), and baking that stale
 * geometry into this cache under the new key would corrupt every nail
 * permanently for that key until reload. Cache key is the resolved base
 * photo URL itself, so it's automatically distinct per (tone, shape, length)
 * variant without needing a separate key-building step.
 */
export function getPreparedHand(tone: SkinToneId, shape?: NailShape, length?: NailLength): Promise<Map<FingerId, PreparedNail>> {
  const url = handBaseUrl(tone, shape, length)
  let cached = preparedCache.get(url)
  if (!cached) {
    cached = getHandData(tone, shape, length).then((hand) =>
      loadImagePixels(url, hand.width, hand.height).then((pixels) => {
        const map = new Map<FingerId, PreparedNail>()
        for (const nail of hand.nails) map.set(nail.id, prepareNail(nail, pixels, tone, shape, length))
        return map
      }),
    )
    preparedCache.set(url, cached)
  }
  return cached
}
