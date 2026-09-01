import type { PreparedNail } from '@/lib/nailLighting'
import { composeNail, DEFAULT_LIGHT, type MaterialConfig, type PaintConfig } from '@/lib/nailFill'
import type { EffectId } from '@/types/vibeu'

/**
 * Synthetic swatch "nail" — a plain rounded-square alpha mask with a shallow dome
 * curvature (no real photo). Used only so the material-effect picker (Defect A) can run
 * the exact same composeNail pipeline the live canvas uses, instead of a separate/fake
 * preview system that could silently drift from what the material actually looks like.
 * Built once and reused for every effect; a fixed neutral showcase colour (not the
 * user's chosen nail colour) isolates material differences, per the "previews must be
 * independent from nail colour" requirement.
 */
function buildSwatchGeometry(size: number): PreparedNail {
  const n = size * size
  const alpha = new Uint8ClampedArray(n)
  const uv = new Float32Array(n * 2)
  const normal = new Float32Array(n * 3)
  const curve = new Float32Array(n)
  const edge = new Float32Array(n)
  const light = new Float32Array(n).fill(0.95)
  const spec = new Float32Array(n).fill(0.5)
  const source = new Uint8ClampedArray(n * 4)

  const cx = size / 2
  const cy = size / 2
  const r = size * 0.46
  const corner = size * 0.32 // rounded-square falloff radius

  for (let yy = 0; yy < size; yy++) {
    for (let xx = 0; xx < size; xx++) {
      const k = yy * size + xx
      const dx = (xx - cx) / r
      const dy = (yy - cy) / r
      // Rounded-square SDF-ish test: superellipse-like power blend reads as a soft
      // rounded-rect "swatch chip" rather than a circle or a hard square.
      const d = Math.pow(Math.abs(dx), 3.2) + Math.pow(Math.abs(dy), 3.2)
      const inside = d <= 1
      alpha[k] = inside ? 255 : 0
      if (!inside) continue

      uv[k * 2] = xx / size
      uv[k * 2 + 1] = yy / size

      const nx = dx * 0.85
      const ny = dy * 0.55
      const nz = Math.sqrt(Math.max(0.15, 1 - nx * nx - ny * ny))
      const len = Math.hypot(nx, ny, nz) || 1
      normal[k * 3] = nx / len
      normal[k * 3 + 1] = ny / len
      normal[k * 3 + 2] = nz / len
      curve[k] = dx * 0.5

      const distToEdge = 1 - Math.min(1, Math.sqrt(d))
      edge[k] = Math.min(1, distToEdge * (size / corner))

      source[k * 4] = 235
      source[k * 4 + 1] = 222
      source[k * 4 + 2] = 214
      source[k * 4 + 3] = 255
    }
  }

  return {
    id: 'index',
    x: 0,
    y: 0,
    w: size,
    h: size,
    alpha,
    uv,
    normal,
    curve,
    edge,
    light,
    spec,
    source,
    photoAmbient: 1,
    photoTint: [1, 1, 1],
  }
}

let swatchGeometryCache: PreparedNail | null = null
function getSwatchGeometry(): PreparedNail {
  if (!swatchGeometryCache) swatchGeometryCache = buildSwatchGeometry(96)
  return swatchGeometryCache
}

const SHOWCASE_PAINT: PaintConfig = {
  mode: 'solid',
  stops: [{ at: 0, color: '#f0a8c8' }],
  start: [0.5, 0],
  end: [0.5, 1],
  opacity: 1,
}

const canvasCache = new Map<EffectId, HTMLCanvasElement>()

/**
 * Renders a small deterministic canvas preview of one material effect, using the real
 * compositor (not a fake stand-in) so it can never silently disagree with the live nail
 * render. Cached per effect since the geometry/paint/light are all fixed. Uses fixed
 * neutral gloss/roughness/glitter/catAngle inputs — independent of any specific colour
 * preset — since this is meant to show the material itself, the same way regardless of
 * which preset the user has selected elsewhere in the tab.
 */
export function renderMaterialSwatch(effect: EffectId): HTMLCanvasElement {
  const cached = canvasCache.get(effect)
  if (cached) return cached
  const g = getSwatchGeometry()
  const materialCfg: MaterialConfig = { type: effect, gloss: 0.55, roughness: 0.45, glitter: 0.55, catAngle: 115 }
  const canvas = composeNail(g, SHOWCASE_PAINT, materialCfg, [], DEFAULT_LIGHT, 0)
  canvasCache.set(effect, canvas)
  return canvas
}
