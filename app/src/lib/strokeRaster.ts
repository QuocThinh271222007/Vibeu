import { localToImage } from '@/lib/geometry'
import type { DecalLayer } from '@/lib/nailFill'
import type { DrawStroke, NailCoord } from '@/types/vibeu'

/**
 * Rasterizes one freehand stroke into a small offscreen canvas and wraps it as a DecalLayer —
 * so it goes through the exact same lit/curvature-warped compositing (embedded strokes, via
 * composeNail's Pass B/C) or the same unlit hand-wide compositing (raised strokes, via
 * composeCharmLayer) as every other decal/charm, instead of being a flat, unlit SVG line drawn
 * on top of the finished render. Returns null for a stroke too short to have any length.
 */
export function buildStrokeDecalLayer(nail: NailCoord, stroke: DrawStroke): DecalLayer | null {
  if (stroke.points.length < 2) return null

  const imagePoints = stroke.points.map((p) => localToImage(nail, p))
  const pad = stroke.width / 2 + 2 // half the line width, plus a little antialiasing margin
  const xs = imagePoints.map((p) => p[0])
  const ys = imagePoints.map((p) => p[1])
  const minX = Math.min(...xs) - pad
  const maxX = Math.max(...xs) + pad
  const minY = Math.min(...ys) - pad
  const maxY = Math.max(...ys) + pad
  const width = Math.max(1, Math.ceil(maxX - minX))
  const height = Math.max(1, Math.ceil(maxY - minY))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  ctx.strokeStyle = stroke.color
  ctx.lineWidth = stroke.width
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  imagePoints.forEach(([x, y], i) => {
    const lx = x - minX
    const ly = y - minY
    if (i === 0) ctx.moveTo(lx, ly)
    else ctx.lineTo(lx, ly)
  })
  ctx.stroke()

  const { data } = ctx.getImageData(0, 0, width, height)

  return {
    pixels: { data, width, height },
    // The whole canvas IS the content — it was sized exactly to the stroke's own bounds above,
    // so there's no separate padding region to trim the way a loaded decal asset needs.
    contentBounds: [0, 0, 1, 1],
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    widthPx: width,
    heightPx: height,
    rotationDeg: 0,
    flipX: false,
    opacity: stroke.opacity ?? 1,
    tint: null,
    // Higher than a printed decal's 0.55 — a hand-drawn line is meant to read as sitting *in*
    // the polish itself, not a sticker laid over it.
    curvature: 0.65,
    layerType: 'decal',
  }
}

export function buildStrokeDecalLayers(nail: NailCoord, strokes: DrawStroke[]): DecalLayer[] {
  return strokes.map((s) => buildStrokeDecalLayer(nail, s)).filter((l): l is DecalLayer => l !== null)
}
