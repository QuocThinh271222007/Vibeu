import type { PreparedNail } from '@/lib/nailLighting'
import type { ColorPreset, EffectId } from '@/types/vibeu'

export interface PaintConfig {
  mode: 'linear' | 'radial' | 'aurora' | 'solid'
  stops: { at: number; color: string }[]
  start: [number, number]
  end: [number, number]
  opacity: number
}

export interface MaterialConfig {
  type: EffectId
  gloss: number
  roughness: number
  glitter: number
  catAngle: number
}

export interface LightState {
  angle: number
  elevation: number
  strength: number
  ambient: number
  photo: number
}

/** A soft, slightly top-left key light — matches the natural light in the stock hand photos. */
export const DEFAULT_LIGHT: LightState = { angle: -45, elevation: 62, strength: 0.5, ambient: 0.88, photo: 0.7 }

export function buildPaintConfig(preset: ColorPreset, customColor: string | null): PaintConfig {
  if (customColor) {
    return { mode: 'solid', stops: [{ at: 0, color: customColor }], start: [0.5, 0], end: [0.5, 1], opacity: 1 }
  }
  const { paint } = preset
  return { mode: paint.mode, stops: paint.stops, start: paint.start, end: paint.end, opacity: paint.opacity }
}

export function buildMaterialConfig(preset: ColorPreset, effect: EffectId): MaterialConfig {
  const { material } = preset
  return { type: effect, gloss: material.gloss, roughness: material.roughness, glitter: material.glitter, catAngle: material.catAngle }
}

function clamp(v: number, a = 0, b = 1): number {
  return Math.min(b, Math.max(a, v))
}

function hexToRgb01(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

function mix3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t]
}

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

function stopSampler(stops: { at: number; color: string }[]) {
  const sorted = stops
    .slice()
    .sort((a, b) => a.at - b.at)
    .map((s) => ({ at: s.at, rgb: hexToRgb01(s.color) }))
  return (t: number): [number, number, number] => {
    if (t <= sorted[0].at) return sorted[0].rgb
    for (let i = 1; i < sorted.length; i++) {
      if (t <= sorted[i].at) {
        const span = sorted[i].at - sorted[i - 1].at || 1
        return mix3(sorted[i - 1].rgb, sorted[i].rgb, clamp((t - sorted[i - 1].at) / span))
      }
    }
    return sorted[sorted.length - 1].rgb
  }
}

function hash(x: number, y: number, s = 1): number {
  const a = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453
  return a - Math.floor(a)
}

/**
 * Renders one nail's paint into a bbox-sized canvas, per pixel, using the
 * nail's own baked normal map + the real photo's luminance for shading. Because
 * lighting is computed against each nail's own rotated uv basis (not a fixed
 * image-space angle), the highlight sits correctly on tilted fingers (thumb,
 * ring, little) instead of cutting across at the wrong angle.
 */
export function renderNailBitmap(
  g: PreparedNail,
  paint: PaintConfig,
  material: MaterialConfig,
  light: LightState = DEFAULT_LIGHT,
  seed = 0,
): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = g.w
  canvas.height = g.h
  const ctx = canvas.getContext('2d')!
  const im = ctx.createImageData(g.w, g.h)
  const out = im.data

  const az = (light.angle * Math.PI) / 180
  const el = (light.elevation * Math.PI) / 180
  const L = norm3([Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)])
  const H = norm3([L[0], L[1], L[2] + 1])

  const solidColor = paint.mode === 'solid' ? hexToRgb01(paint.stops[0]?.color ?? '#cccccc') : null
  const sample = solidColor ? null : stopSampler(paint.stops)
  const [a0, a1] = paint.start
  const [b0, b1] = paint.end
  const jellyOpacity = material.type === 'jelly' ? Math.min(paint.opacity, 0.75) : paint.opacity

  for (let k = 0; k < g.w * g.h; k++) {
    const off = k * 4
    const alpha = g.alpha[k]
    if (!alpha) continue
    const u = g.uv[k * 2]
    const v = g.uv[k * 2 + 1]
    const nx = g.normal[k * 3]
    const ny = g.normal[k * 3 + 1]
    const nz = g.normal[k * 3 + 2]

    let t = 0
    if (paint.mode === 'linear') {
      t = ((u - a0) * (b0 - a0) + (v - a1) * (b1 - a1)) / ((b0 - a0) ** 2 + (b1 - a1) ** 2 || 1)
    } else if (paint.mode === 'radial') {
      t = Math.hypot(u - a0, v - a1) / (Math.hypot(b0 - a0, b1 - a1) || 0.5)
    } else if (paint.mode === 'aurora') {
      t = 0.5 + 0.28 * Math.sin(u * 5 + v * 4) + 0.22 * Math.cos(v * 7 - u * 2)
    }
    let color: [number, number, number] = solidColor ?? sample!(clamp(t))

    if (material.type === 'chrome') {
      const stripe = 0.54 + 0.38 * Math.sin(u * 8 + v * 2.3 + light.angle / 70)
      color = mix3(color, [stripe, stripe, stripe], 0.62)
    }

    const diffuse = Math.max(0, nx * L[0] + ny * L[1] + nz * L[2])
    const shade = g.light[k] * (light.ambient + light.strength * (diffuse - 0.75) * 0.5)
    color = [clamp(color[0] * shade), clamp(color[1] * shade), clamp(color[2] * shade)]

    if (material.type === 'catEye') {
      const ca = (material.catAngle * Math.PI) / 180
      const d = (u - 0.5) * Math.cos(ca) + (v - 0.5) * Math.sin(ca)
      const band = Math.exp(-(((d + 0.08 * Math.sin(v * 4)) / 0.095) ** 2))
      color = mix3(color, [0.94, 0.9, 1], band * 0.6)
    }

    const specN = Math.max(0, nx * H[0] + ny * H[1] + nz * H[2])
    let specVal =
      Math.pow(specN, 8 + (1 - material.roughness) * 110) * light.strength * material.gloss * 0.65 +
      g.spec[k] * light.photo * material.gloss * 0.6
    if (material.type === 'catEye') {
      const xx = k % g.w
      const yy = Math.floor(k / g.w)
      const noise = hash(xx, yy, seed + 1)
      if (noise > 1 - material.glitter * 0.15) specVal += (noise > 0.995 ? 0.7 : 0.22) * material.glitter * 2
    }
    specVal = clamp(specVal, 0, 0.88)
    color = mix3(color, [1, 1, 1], specVal)

    const srcColor: [number, number, number] = [g.source[off] / 255, g.source[off + 1] / 255, g.source[off + 2] / 255]
    color = mix3(srcColor, color, jellyOpacity)

    out[off] = clamp(color[0]) * 255
    out[off + 1] = clamp(color[1]) * 255
    out[off + 2] = clamp(color[2]) * 255
    out[off + 3] = alpha
  }

  ctx.putImageData(im, 0, 0)
  return canvas
}
