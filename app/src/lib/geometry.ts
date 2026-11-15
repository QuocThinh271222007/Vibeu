import { FINGER_ORDER, type FingerDesign, type FingerId, type NailCoord, type NailLength, type NailShape } from '@/types/vibeu'

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

// A nail renders at most a few hundred px wide, so anything past 4 decimals of UV precision
// (~0.0001 of that) is visually meaningless — yet pointer coordinates default to full float64
// precision (~17 significant digits) when JSON-serialized (rounding alone cuts stored bytes/point
// roughly 3x). On top of that, pointermove fires more often than a visible stroke needs — real
// captured strokes were measured landing consecutive points ~0.004-0.006 UV apart even during
// deliberate drawing, so this also thins out redundant points without visibly changing the shape.
// Combined, some hand-drawn templates had ended up with a single finger's strokes over 1MB of
// JSON (real example found: "creeper" — 1.04MB for one finger).
const STROKE_MIN_STEP = 0.006

/** Rounds a UV point to 4 decimals — see STROKE_MIN_STEP for why. */
export function roundUv([u, v]: UV): UV {
  return [Math.round(u * 10000) / 10000, Math.round(v * 10000) / 10000]
}

/** Appends `next` to a stroke's points, skipping it if it's too close to the last kept point to
 * be visually distinguishable (see STROKE_MIN_STEP) — cuts stored/rendered point count for slow
 * or careful pen movements without changing how the stroke looks. Used while a stroke is being
 * actively drawn (src/components/studio/HandCanvas.tsx); the first point of a stroke is always
 * kept regardless of distance. */
export function appendStrokePoint(points: UV[], next: UV): UV[] {
  const rounded = roundUv(next)
  const last = points[points.length - 1]
  if (last) {
    const du = rounded[0] - last[0]
    const dv = rounded[1] - last[1]
    if (du * du + dv * dv < STROKE_MIN_STEP * STROKE_MIN_STEP) return points
  }
  return [...points, rounded]
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
 *
 * This is deliberately NOT where shape/length become visually real — a 2D
 * warp of one photo can't truthfully turn a photographed nail into a longer
 * or differently-shaped one. The actual fix is `handVariants.ts`: a second,
 * genuinely re-photographed base hand image per (shape, length) that
 * `HandCanvas`/`exportImage` switch to via `uniformShapeLength` below, when
 * all 5 fingers agree and that photo exists.
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
 * part of the design recipe. See the `handVariants.ts` note on `LENGTH_SCALE`
 * above — real shape differences come from switching the base photo, not
 * from trimming this one.
 */
export function shapeTrimUv(_shape: NailShape): UV[] | null {
  return null
}

/**
 * The base hand photo is one whole-hand image, so it can only visually
 * represent ONE shape+length at a time — not five independently-shaped
 * fingers. Returns the shared (shape, length) only when every finger agrees;
 * otherwise null, meaning "no single photo can represent this mix, stay on
 * the default photo" (today's behavior, unchanged).
 */
export function uniformShapeLength(fingers: Record<FingerId, FingerDesign>): { shape: NailShape; length: NailLength } | null {
  const first = fingers[FINGER_ORDER[0]]
  const uniform = FINGER_ORDER.every((f) => fingers[f].shape === first.shape && fingers[f].length === first.length)
  return uniform ? { shape: first.shape, length: first.length } : null
}

export function trimPolygonToImagePoints(nail: NailCoord, uvPoly: UV[]): string {
  return uvPoly.map((uv) => localToImage(nail, uv).join(',')).join(' ')
}

/** Convert a color-pack preset UV point (already 0..1, U horizontal, V cuticle->tip) to image space. */
export function presetUvToImage(nail: NailCoord, uv: UV): [number, number] {
  return localToImage(nail, uv)
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
