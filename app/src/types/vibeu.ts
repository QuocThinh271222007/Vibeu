export type FingerId = 'thumb' | 'index' | 'middle' | 'ring' | 'little'

export const FINGER_ORDER: FingerId[] = ['thumb', 'index', 'middle', 'ring', 'little']

export const FINGER_LABEL_VI: Record<FingerId, string> = {
  thumb: 'Ngón cái',
  index: 'Ngón trỏ',
  middle: 'Ngón giữa',
  ring: 'Ngón áp út',
  little: 'Ngón út',
}

export type SkinToneId = 'cozy' | 'matcha'

export interface UvFrame {
  u: [number, number]
  v: [number, number]
  minU: number
  maxU: number
  minV: number
  maxV: number
}

export interface NailCoord {
  id: FingerId
  name: string
  bbox: [number, number, number, number]
  center: [number, number]
  axis: [number, number]
  path: string
  uvFrame: UvFrame
}

export interface HandData {
  width: number
  height: number
  nails: NailCoord[]
}

export type PaintMode = 'linear' | 'radial' | 'aurora'

export interface PaintStop {
  at: number
  color: string
}

export interface ColorPreset {
  id: string
  name: string
  descriptionVi: string
  palette: [string, string, string, string, string]
  paint: {
    mode: PaintMode
    color: string
    stops: PaintStop[]
    start: [number, number]
    end: [number, number]
    opacity: number
  }
  material: {
    type: string
    gloss: number
    roughness: number
    glitter: number
    catAngle: number
  }
  pattern: {
    type: string
    color: string
    size: number
    opacity: number
  }
  swatch: {
    svg: string
    png: string
    width: number
    height: number
  }
}

export type EffectId = 'gel' | 'jelly' | 'catEye' | 'chrome' | 'matte' | 'glitter' | 'holo'

export const EFFECT_LABEL_VI: Record<EffectId, string> = {
  gel: 'Sơn Gel',
  jelly: 'Sơn thạch',
  catEye: 'Mắt mèo',
  chrome: 'Chrome',
  matte: 'Lì (Matte)',
  glitter: 'Nhũ óng ánh',
  holo: 'Ánh cầu vồng (Holo)',
}

export type NailShape = 'oval' | 'square' | 'coffin' | 'almond'

export const SHAPE_LABEL_VI: Record<NailShape, string> = {
  oval: 'Oval',
  square: 'Vuông',
  coffin: 'Coffin',
  almond: 'Nhọn',
}

export type NailLength = 'S' | 'M' | 'L'

export type DecalLayerType = 'decal' | 'foil' | 'raised'

/**
 * One nail-art decal asset. Real vector nail decals (florals, hearts, celestial,
 * butterflies, bows, animal print, geometric/French-tip lines, foil/abstract,
 * fruit, seasonal, text/symbols, flat gem outlines) — not emoji illustrations.
 * `contentBounds` is the actual (non-transparent-padding) region of the asset
 * in 0..1 image-space, so centering/scaling isn't thrown off by SVG margin.
 */
export interface DecalAsset {
  id: string
  name: string
  nameVi: string
  category: string
  categoryVi: string
  tags: string[]
  path: string
  viewBox: [number, number]
  contentBounds: [number, number, number, number]
  defaultScale: number
  /** Whether the app's tint control may recolor this asset (line-art) vs. it being inherently multi-color (florals, fruit, gems). */
  tintable: boolean
  layerType: DecalLayerType
  source: string
  license: string
}

export interface StickerCategory {
  id: string
  nameVi: string
  count: number
}

export interface StickerInstance {
  instanceId: string
  stickerId: string
  uv: [number, number]
  scale: number
  rotation: number
  flipX?: boolean
  opacity?: number
  tint?: string | null
  visible?: boolean
  locked?: boolean
  z: number
}

export interface CustomGradient {
  mode: PaintMode
  stops: PaintStop[]
  start: [number, number]
  end: [number, number]
}

export interface FingerDesign {
  shape: NailShape
  length: NailLength
  presetId: string
  customColor: string | null
  /** Per-finger gradient override, independent of the shared preset library — editing it never mutates preset data. Mutually exclusive with customColor. */
  customGradient: CustomGradient | null
  effect: EffectId
  stickers: StickerInstance[]
}

export interface Template {
  id: string
  name: string
  hashtag: string
  tags: string[]
  skinTone: SkinToneId
  fingers: Record<FingerId, Partial<FingerDesign>>
}
