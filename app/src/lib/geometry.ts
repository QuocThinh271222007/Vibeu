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

/** Convert an image-space [x,y] point to the nail's normalized local (u,v) space. */
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

/**
 * Build an SVG affine matrix() string that anisotropically scales the nail
 * along its local V axis (cuticle -> tip) by `scale`, pivoting at the cuticle
 * point (u=0.5, v=0), so length changes grow the tip outward realistically.
 */
export function lengthScaleMatrix(nail: NailCoord, scale: number): string {
  const [vx, vy] = nail.uvFrame.v
  const s = scale
  const a = 1 + (s - 1) * vx * vx
  const b = (s - 1) * vx * vy
  const c = (s - 1) * vx * vy
  const d = 1 + (s - 1) * vy * vy
  const [px, py] = localToImage(nail, [0.5, 0])
  const e = px - (a * px + c * py)
  const f = py - (b * px + d * py)
  return `matrix(${a} ${b} ${c} ${d} ${e} ${f})`
}

export const LENGTH_SCALE: Record<'S' | 'M' | 'L', number> = {
  S: 0.86,
  M: 1,
  L: 1.16,
}

/**
 * Generic tip-trim polygons in nail-local unit space, intersected with the
 * real photographic nail mask to approximate a form/shape without needing
 * per-shape photography. Returns null for 'oval' (uses the real mask as-is).
 */
export function shapeTrimUv(shape: NailShape): UV[] | null {
  switch (shape) {
    case 'oval':
      return null
    case 'square':
      return [
        [-0.2, -0.25],
        [1.2, -0.25],
        [1.2, 0.84],
        [-0.2, 0.84],
      ]
    case 'coffin':
      return [
        [-0.2, -0.25],
        [1.2, -0.25],
        [1.2, 0.64],
        [0.82, 0.9],
        [0.18, 0.9],
        [-0.2, 0.64],
      ]
    case 'almond':
      return [
        [-0.2, -0.25],
        [1.2, -0.25],
        [1.2, 0.52],
        [0.5, 1.18],
        [-0.2, 0.52],
      ]
    default:
      return null
  }
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
