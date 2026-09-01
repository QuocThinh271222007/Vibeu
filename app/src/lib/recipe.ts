import { EFFECT_LABEL_VI, FINGER_LABEL_VI, FINGER_ORDER, SHAPE_LABEL_VI } from '@/types/vibeu'
import type { ColorPreset, DecalAsset, FingerId, FingerDesign } from '@/types/vibeu'

export interface SpecRow {
  finger: FingerId
  fingerLabel: string
  colorLabel: string
  colorSwatch: string
  effectLabel: string
  shapeLabel: string
  lengthLabel: string
  charmNames: string[]
}

export function buildSpecRows(
  fingers: Record<FingerId, FingerDesign>,
  presetsById: Record<string, ColorPreset>,
  stickersById: Record<string, DecalAsset>,
): SpecRow[] {
  return FINGER_ORDER.map((f) => {
    const d = fingers[f]
    const preset = presetsById[d.presetId]
    return {
      finger: f,
      fingerLabel: FINGER_LABEL_VI[f],
      colorLabel: d.customColor ? `Tùy chỉnh ${d.customColor}` : preset?.name ?? d.presetId,
      colorSwatch: d.customColor ?? preset?.paint.color ?? '#EEE',
      effectLabel: EFFECT_LABEL_VI[d.effect],
      shapeLabel: SHAPE_LABEL_VI[d.shape],
      lengthLabel: d.length,
      charmNames: d.stickers.map((s) => stickersById[s.stickerId]?.nameVi ?? s.stickerId),
    }
  })
}

export function generateShareId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

export function buildShareUrl(shareId: string): string {
  return `https://vibeu.app/r/${shareId}`
}
