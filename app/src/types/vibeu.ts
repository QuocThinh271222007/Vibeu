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

export type EffectId = 'gel' | 'jelly' | 'catEye' | 'chrome'

export const EFFECT_LABEL_VI: Record<EffectId, string> = {
  gel: 'Sơn Gel',
  jelly: 'Sơn thạch',
  catEye: 'Mắt mèo',
  chrome: 'Chrome',
}

export type NailShape = 'oval' | 'square' | 'coffin' | 'almond'

export const SHAPE_LABEL_VI: Record<NailShape, string> = {
  oval: 'Oval',
  square: 'Vuông',
  coffin: 'Coffin',
  almond: 'Nhọn',
}

export type NailLength = 'S' | 'M' | 'L'

export interface StickerVariantMeta {
  path: string
  width?: number | string
  height?: number | string
}

export interface StickerDef {
  id: string
  name: string
  nameVi: string
  category: string
  categoryVi: string
  tags: string[]
  variants: {
    '3d': StickerVariantMeta
    color: StickerVariantMeta
    flat: StickerVariantMeta
  }
  defaultVariant: '3d' | 'color' | 'flat'
  suggestedInitialScaleRelativeToNailWidth: number
  suggestedAnchor: [number, number]
}

export interface StickerCategory {
  id: string
  nameVi: string
  count: number
}

export interface StickerInstance {
  instanceId: string
  stickerId: string
  variant: '3d' | 'color' | 'flat'
  uv: [number, number]
  scale: number
  rotation: number
  z: number
}

export interface FingerDesign {
  shape: NailShape
  length: NailLength
  presetId: string
  customColor: string | null
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
