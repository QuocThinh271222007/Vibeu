import { EFFECT_LABEL_VI, FINGER_LABEL_VI, FINGER_ORDER, LENGTH_LABEL_VI, SHAPE_LABEL_VI } from '@/types/vibeu'
import type { ColorPreset, DecalAsset, FingerId, FingerDesign } from '@/types/vibeu'

const GRADIENT_MODE_LABEL_VI: Record<string, string> = {
  linear: 'Gradient thẳng',
  radial: 'Gradient tròn',
  aurora: 'Aura',
  solid: 'Đơn sắc',
  ombre: 'Ombre',
  french: 'French',
  marble: 'Vân đá',
  watercolor: 'Màu nước',
  tortoiseshell: 'Đồi mồi',
  bleed: 'Loang màu',
  speckle: 'Đốm confetti',
}

export interface SpecRow {
  finger: FingerId
  fingerLabel: string
  colorLabel: string
  colorSwatch: string
  effectLabel: string
  shapeLabel: string
  lengthLabel: string
  charmNames: string[]
  drawNote: string | null
}

/** Groups duplicate charm names into "Tên x2" instead of repeating the name once per instance. */
function summarizeCharmNames(names: string[]): string[] {
  const counts = new Map<string, number>()
  for (const n of names) counts.set(n, (counts.get(n) ?? 0) + 1)
  return [...counts.entries()].map(([name, count]) => (count > 1 ? `${name} x${count}` : name))
}

export function buildSpecRows(
  fingers: Record<FingerId, FingerDesign>,
  presetsById: Record<string, ColorPreset>,
  stickersById: Record<string, DecalAsset>,
): SpecRow[] {
  return FINGER_ORDER.map((f) => {
    const d = fingers[f]
    const preset = presetsById[d.presetId]
    const colorLabel = d.customColor
      ? `Tùy chỉnh ${d.customColor}`
      : d.customGradient
        ? `${GRADIENT_MODE_LABEL_VI[d.customGradient.mode] ?? 'Gradient tùy chỉnh'} (tuỳ chỉnh)`
        : (preset?.name ?? d.presetId)
    return {
      finger: f,
      fingerLabel: FINGER_LABEL_VI[f],
      colorLabel,
      colorSwatch: d.customColor ?? d.customGradient?.stops[0]?.color ?? preset?.paint.color ?? '#EEE',
      effectLabel: EFFECT_LABEL_VI[d.effect],
      shapeLabel: SHAPE_LABEL_VI[d.shape],
      lengthLabel: LENGTH_LABEL_VI[d.length],
      charmNames: summarizeCharmNames(d.stickers.map((s) => stickersById[s.stickerId]?.nameVi ?? s.stickerId)),
      drawNote: d.drawStrokes.length > 0 ? `${d.drawStrokes.length} nét vẽ tay` : null,
    }
  })
}

export function generateShareId(): string {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4)
}

/**
 * Points at wherever the app is actually running (localhost in dev, the real deployed
 * domain in prod) instead of a hardcoded placeholder — a QR encoding the wrong host would
 * never resolve to anything for whoever scans it.
 */
export function buildShareUrl(shareId: string, fragment?: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const base = `${origin}/r/${shareId}`
  return fragment ? `${base}#d=${fragment}` : base
}
