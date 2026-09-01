import type { NailCoord, NailShape } from '@/types/vibeu'

/** A point in the nail's normalized local space: u = across width [0,1], v = cuticle(0) -> tip(1). */
export type UV = [number, number]

/** Convert a normalized nail-local (u,v) point to image-space [x,y] using the nail's uvFrame. */
export function localToImage(nail: NailCoord, uv: UV): [number, number] {
  const { uvFrame, center } = nail
  const localU = uvFrame.minU + uv[0] * (uvFrame.maxU - uvFrame.minU)
  const localV = uvFrame.minV + uv[1] * (uvFrame.maxV - uvFrame.minV)
  const x = center[0] + localU * uvFrame.u[0] + localV * uvFrame.v[0]
  const y = center[1] + localU * uvFrame.u[1] + localV * uvFrame.v[1]
  return [x, y]
}

/** Convert an image-space [x,y] point to the nail's normalized (u,v) space. */
export function imageToLocal(nail: NailCoord, pt: [number, number]): UV {
  const { uvFrame, center } = nail
  const rx = pt[0] - center[0]
  const ry = pt[1] - center[1]
  const localU = rx * uvFrame.u[0] + ry * uvFrame.u[1]
  const localV = rx * uvFrame.v[0] + ry * uvFrame.v[1]
  const u = (localU - uvFrame.minU) / (uvFrame.maxU - uvFrame.minU)
  const v = (localV - uvFrame.minV) / (uvFrame.maxV - uvFrame.minV)
  return [u, v]
}

/** Nail width in image-space px (u extent), used to size stickers relative to nail. */
export function nailWidthPx(nail: NailCoord): number {
  return nail.uvFrame.maxU - nail.uvFrame.minU
}

export function nailHeightPx(nail: NailCoord): number {
  return nail.uvFrame.maxV - nail.uvFrame.minV
}

export interface AffineMatrix {
  a: number
  b: number
  c: number
  d: number
  e: number
  f: number
}

/**
 * Anisotropically scales the nail along its local V axis. The compositor is
 * currently locked to the photographed nail silhouette (see LENGTH_SCALE),
 * but the matrix helper remains the canonical implementation for a future
 * geometry-aware extension pass.
 */
export function lengthScaleMatrixValues(nail: NailCoord, scale: number): AffineMatrix {
  const [vx, vy] = nail.uvFrame.v
  const s = scale
  const a = 1 + (s - 1) * vx * vx
  const b = (s - 1) * vx * vy
  const c = (s - 1) * vx * vy
  const d = 1 + (s - 1) * vy * vy
  const [px, py] = localToImage(nail, [0.5, 0])
  const e = px - (a * px + c * py)
  const f = py - (b * px + d * py)
  return { a, b, c, d, e, f }
}

/** Build an SVG affine matrix() string form of {@link lengthScaleMatrixValues}. */
export function lengthScaleMatrix(nail: NailCoord, scale: number): string {
  const { a, b, c, d, e, f } = lengthScaleMatrixValues(nail, scale)
  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`
}

/**
 * Photographic compositor invariant: never distort the baked paint away from
 * the real nail bed unless we also have pixels/geometry for the newly exposed
 * or extended silhouette. The previous S/L transforms revealed parts of the
 * unpainted source nail and produced obvious grey wedges. Length is therefore
 * preserved in the recipe/state but the live photo remains registration-safe.
 */
export const LENGTH_SCALE: Record<'S' | 'M' | 'L', number> = {
  S: 1,
  M: 1,
  L: 1,
}

/**
 * Photographic compositor invariant: a 2D trim cannot truthfully turn the
 * photographed nail into square/coffin/almond. Trimming the paint layer only
 * exposes the original nail underneath and reads as a broken mask. Keep the
 * full real nail silhouette for every shape; the selected shape still remains
 * part of the design recipe and can be rendered later by a geometry-aware
 * extension/segmentation stage.
 */
export function shapeTrimUv(_shape: NailShape): UV[] | null {
  return null
}

export function trimPolygonToImagePoints(nail: NailCoord, uvPoly: UV[]): string {
  return uvPoly.map((uv) => localToImage(nail, uv).join(',')).join(' ')
}

/** Convert a color-pack preset UV point (already 0..1, U horizontal, V cuticle->tip) to image space. */
export function presetUvToImage(nail: NailCoord, uv: UV): [number, number] {
  return localToImage(nail, uv)
}

/**
 * Affine matrix that uniformly scales `nail.path` around the nail's own center by
 * roughly `growPx` image-space pixels outward. Used only to grow the visible clip region
 * to match the matching outward growth already baked into the painted raster by
 * nailLighting.ts's `prepareNail` (see nailEdgeTuning.ts) — without this, the clip stays
 * at the original traced boundary and the newly-painted pixels are clipped away for
 * nothing. A uniform center-scale isn't a true offset-outline (a real Minkowski dilation
 * of the bezier path), but for a few pixels of correction on an already-rounded nail
 * shape it's visually indistinguishable and far simpler/safer than reconstructing the
 * path geometry. Returns `null` for `growPx <= 0` (no growth needed).
 */
export function nailGrowMatrixValues(nail: NailCoord, growPx: number): AffineMatrix | null {
  if (growPx <= 0) return null
  const [, , bw, bh] = nail.bbox
  const avgHalfExtent = (bw + bh) / 4 || 1
  const scale = 1 + growPx / avgHalfExtent
  const [cx, cy] = nail.center
  const e = cx - scale * cx
  const f = cy - scale * cy
  return { a: scale, b: 0, c: 0, d: scale, e, f }
}

/** SVG matrix() string form of {@link nailGrowMatrixValues}, for the live DOM clipPath. */
export function nailGrowMatrix(nail: NailCoord, growPx: number): string | undefined {
  const m = nailGrowMatrixValues(nail, growPx)
  return m ? `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})` : undefined
}

export function distancePx(a: [number, number], b: [number, number]): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

/** Rotate a local (x,y) offset by `deg` degrees (image-space, y-down). */
export function rotatePointDeg(x: number, y: number, deg: number): [number, number] {
  const r = (deg * Math.PI) / 180
  const cos = Math.cos(r)
  const sin = Math.sin(r)
  return [x * cos - y * sin, x * sin + y * cos]
}
