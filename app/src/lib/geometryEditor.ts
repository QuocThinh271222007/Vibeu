import type { FingerId, HandData, NailCoord } from '@/types/vibeu'
import type { NailLength, NailShape, SkinToneId } from '@/types/vibeu'

export interface GeometryPoint {
  x: number
  y: number
}

export interface GeometryEditorMetadata {
  version: 1
  tone: SkinToneId
  shape: NailShape
  length: NailLength
  selectedFinger: FingerId
  savedAt: string
}

export type GeometryEditorDocument = HandData & {
  _vibeuGeometry?: GeometryEditorMetadata
}

export interface DetectedGeometryTarget {
  tone: SkinToneId
  shape: NailShape
  length: NailLength
  selectedFinger?: FingerId
}

const SKIN_TONES = new Set<SkinToneId>(['cozy', 'matcha'])
const SHAPES = new Set<NailShape>(['oval', 'square', 'coffin', 'almond', 'stiletto'])
const LENGTHS = new Set<NailLength>(['S', 'M', 'L'])
const FINGERS = new Set<FingerId>(['thumb', 'index', 'middle', 'ring', 'little'])

const NUMBER = /-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi

export function geometryEditorDocument(
  hand: HandData,
  target: Omit<GeometryEditorMetadata, 'version' | 'savedAt'>,
): GeometryEditorDocument {
  return {
    ...hand,
    _vibeuGeometry: {
      version: 1,
      ...target,
      savedAt: new Date().toISOString(),
    },
  }
}

/** Detects files exported by the editor and legacy files that still use the
 * `<tone>-<shape>-<length>-coordinates.json` filename convention. */
export function detectGeometryTarget(value: unknown, filename = ''): DetectedGeometryTarget | null {
  if (value && typeof value === 'object') {
    const metadata = (value as { _vibeuGeometry?: Partial<GeometryEditorMetadata> })._vibeuGeometry
    const normalizedLength = metadata?.length?.toUpperCase() as NailLength | undefined
    if (
      metadata &&
      SKIN_TONES.has(metadata.tone as SkinToneId) &&
      SHAPES.has(metadata.shape as NailShape) &&
      LENGTHS.has(normalizedLength as NailLength)
    ) {
      return {
        tone: metadata.tone as SkinToneId,
        shape: metadata.shape as NailShape,
        length: normalizedLength as NailLength,
        selectedFinger: FINGERS.has(metadata.selectedFinger as FingerId) ? metadata.selectedFinger as FingerId : undefined,
      }
    }
  }

  const match = filename.match(/(?:^|[-_])(cozy|matcha)[-_](oval|square|coffin|almond|stiletto)[-_]([sml])(?:[-_.]|$)/i)
  if (!match) return null
  return {
    tone: match[1].toLowerCase() as SkinToneId,
    shape: match[2].toLowerCase() as NailShape,
    length: match[3].toUpperCase() as NailLength,
  }
}

export function parsePathPoints(path: string): GeometryPoint[] {
  const values = path.match(NUMBER)?.map(Number) ?? []
  if (values.length < 6 || values.length % 2 !== 0 || values.some((value) => !Number.isFinite(value))) {
    throw new Error('Path phải chứa ít nhất 3 điểm M/L hợp lệ.')
  }
  const points: GeometryPoint[] = []
  for (let index = 0; index < values.length; index += 2) {
    points.push({ x: values[index], y: values[index + 1] })
  }
  return points
}

export function serializePath(points: GeometryPoint[], precision = 1): string {
  if (points.length < 3) throw new Error('Một móng cần ít nhất 3 điểm.')
  return `M ${points.map(({ x, y }) => `${x.toFixed(precision)} ${y.toFixed(precision)}`).join(' L ')} Z`
}

export function pointsForHand(hand: HandData): Record<FingerId, GeometryPoint[]> {
  return Object.fromEntries(hand.nails.map((nail) => [nail.id, parsePathPoints(nail.path)])) as Record<FingerId, GeometryPoint[]>
}

function normalize(vector: [number, number]): [number, number] {
  const magnitude = Math.hypot(vector[0], vector[1]) || 1
  return [vector[0] / magnitude, vector[1] / magnitude]
}

const round = (value: number, digits = 3) => Number(value.toFixed(digits))

export function rebuildNail(source: NailCoord, points: GeometryPoint[], axis = source.axis): NailCoord {
  if (points.length < 3) throw new Error(`${source.name} cần ít nhất 3 điểm.`)
  const [vx, vy] = normalize(axis)
  const ux = vy
  const uy = -vx
  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const xs = points.map((point) => point.x)
  const ys = points.map((point) => point.y)
  const localU = points.map((point) => (point.x - centerX) * ux + (point.y - centerY) * uy)
  const localV = points.map((point) => (point.x - centerX) * vx + (point.y - centerY) * vy)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)

  return {
    ...source,
    bbox: [round(minX, 1), round(minY, 1), round(Math.max(...xs) - minX, 1), round(Math.max(...ys) - minY, 1)],
    center: [round(centerX), round(centerY)],
    axis: [round(vx, 6), round(vy, 6)],
    path: serializePath(points),
    uvFrame: {
      u: [round(ux, 6), round(uy, 6)],
      v: [round(vx, 6), round(vy, 6)],
      minU: round(Math.min(...localU)),
      maxU: round(Math.max(...localU)),
      minV: round(Math.min(...localV)),
      maxV: round(Math.max(...localV)),
    },
  }
}

export function replaceNailGeometry(
  hand: HandData,
  finger: FingerId,
  points: GeometryPoint[],
  axis?: [number, number],
): HandData {
  return {
    ...hand,
    nails: hand.nails.map((nail) => (nail.id === finger ? rebuildNail(nail, points, axis) : nail)),
  }
}

export function validateHandData(value: unknown): HandData {
  if (!value || typeof value !== 'object') throw new Error('JSON không phải object.')
  const hand = value as Partial<HandData>
  if (!Number.isFinite(hand.width) || !Number.isFinite(hand.height) || !Array.isArray(hand.nails)) {
    throw new Error('Thiếu width, height hoặc nails.')
  }
  const required = new Set<FingerId>(['thumb', 'index', 'middle', 'ring', 'little'])
  for (const nail of hand.nails) {
    if (!required.has(nail.id)) throw new Error(`Finger id không hợp lệ: ${String(nail.id)}`)
    parsePathPoints(nail.path)
    required.delete(nail.id)
  }
  if (required.size) throw new Error(`Thiếu geometry: ${[...required].join(', ')}`)
  return hand as HandData
}

export function nearestSegmentIndex(points: GeometryPoint[], point: GeometryPoint): number {
  let bestIndex = 0
  let bestDistance = Number.POSITIVE_INFINITY
  for (let index = 0; index < points.length; index += 1) {
    const start = points[index]
    const end = points[(index + 1) % points.length]
    const dx = end.x - start.x
    const dy = end.y - start.y
    const denominator = dx * dx + dy * dy || 1
    const t = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / denominator))
    const px = start.x + dx * t
    const py = start.y + dy * t
    const distance = Math.hypot(point.x - px, point.y - py)
    if (distance < bestDistance) {
      bestDistance = distance
      bestIndex = index
    }
  }
  return bestIndex
}

export function transformPoints(
  points: GeometryPoint[],
  transform: { dx?: number; dy?: number; scaleX?: number; scaleY?: number; rotation?: number },
  nailAxis: [number, number] = [0, 1],
): GeometryPoint[] {
  const centerX = points.reduce((sum, point) => sum + point.x, 0) / points.length
  const centerY = points.reduce((sum, point) => sum + point.y, 0) / points.length
  const [vx, vy] = normalize(nailAxis)
  const ux = vy
  const uy = -vx
  const radians = ((transform.rotation ?? 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const scaleX = transform.scaleX ?? 1
  const scaleY = transform.scaleY ?? 1
  return points.map((point) => {
    const sourceX = point.x - centerX
    const sourceY = point.y - centerY
    // scaleX is nail-local width (U), scaleY is cuticle-to-tip length (V).
    const localU = (sourceX * ux + sourceY * uy) * scaleX
    const localV = (sourceX * vx + sourceY * vy) * scaleY
    const x = localU * ux + localV * vx
    const y = localU * uy + localV * vy
    return {
      x: centerX + x * cos - y * sin + (transform.dx ?? 0),
      y: centerY + x * sin + y * cos + (transform.dy ?? 0),
    }
  })
}

export function rotateAxis(axis: [number, number], degrees: number): [number, number] {
  const radians = (degrees * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  return normalize([axis[0] * cos - axis[1] * sin, axis[0] * sin + axis[1] * cos])
}

function signedArea(points: GeometryPoint[]): number {
  let twiceArea = 0
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index]
    const next = points[(index + 1) % points.length]
    twiceArea += point.x * next.y - next.x * point.y
  }
  return twiceArea / 2
}

function averageCenter(points: GeometryPoint[]): GeometryPoint {
  return {
    x: points.reduce((sum, point) => sum + point.x, 0) / points.length,
    y: points.reduce((sum, point) => sum + point.y, 0) / points.length,
  }
}

/** Uniformly samples a closed polygon by arc length before filtering. This prevents
 * a dense hand-traced region from being smoothed more aggressively than a sparse one. */
export function resampleClosedPath(points: GeometryPoint[], count: number): GeometryPoint[] {
  if (points.length < 3) throw new Error('Một móng cần ít nhất 3 điểm.')
  const lengths = points.map((point, index) => {
    const next = points[(index + 1) % points.length]
    return Math.hypot(next.x - point.x, next.y - point.y)
  })
  const perimeter = lengths.reduce((sum, value) => sum + value, 0)
  if (perimeter <= 0) return points.map((point) => ({ ...point }))
  const result: GeometryPoint[] = []
  let segment = 0
  let segmentStart = 0
  for (let sample = 0; sample < count; sample += 1) {
    const distance = (sample / count) * perimeter
    while (segment < lengths.length - 1 && segmentStart + lengths[segment] < distance) {
      segmentStart += lengths[segment]
      segment += 1
    }
    const start = points[segment]
    const end = points[(segment + 1) % points.length]
    const t = lengths[segment] > 0 ? (distance - segmentStart) / lengths[segment] : 0
    result.push({ x: start.x + (end.x - start.x) * t, y: start.y + (end.y - start.y) * t })
  }
  return result
}

/**
 * Periodic low-pass geometry filter for hand-traced nail masks.
 *
 * Each pass applies a circular [1/4, 1/2, 1/4] Laplacian kernel. The original
 * centroid and signed area are then restored, avoiding the positional drift and
 * shrinkage caused by plain Chaikin/Laplacian smoothing.
 */
export function smoothClosedPath(points: GeometryPoint[], strength = 2, pointCount?: number): GeometryPoint[] {
  const count = Math.max(24, Math.min(160, pointCount ?? Math.max(64, points.length)))
  const originalCenter = averageCenter(points)
  const originalArea = Math.abs(signedArea(points))
  let current = resampleClosedPath(points, count)
  const passes = Math.max(1, Math.min(8, Math.round(strength)))
  for (let pass = 0; pass < passes; pass += 1) {
    current = current.map((point, index, source) => {
      const previous = source[(index - 1 + source.length) % source.length]
      const next = source[(index + 1) % source.length]
      return {
        x: previous.x * 0.25 + point.x * 0.5 + next.x * 0.25,
        y: previous.y * 0.25 + point.y * 0.5 + next.y * 0.25,
      }
    })
  }
  const smoothedCenter = averageCenter(current)
  const smoothedArea = Math.abs(signedArea(current))
  const areaScale = originalArea > 0 && smoothedArea > 0 ? Math.sqrt(originalArea / smoothedArea) : 1
  return current.map((point) => ({
    x: originalCenter.x + (point.x - smoothedCenter.x) * areaScale,
    y: originalCenter.y + (point.y - smoothedCenter.y) * areaScale,
  }))
}
