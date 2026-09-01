import { FINGER_ORDER, type FingerDesign, type FingerId, type Template } from '@/types/vibeu'

function defaultFinger(): FingerDesign {
  return {
    shape: 'oval',
    length: 'M',
    presetId: 'cloud-candy',
    customColor: null,
    customGradient: null,
    effect: 'gel',
    stickers: [],
  }
}

export function fingersFromTemplate(template: Template): Record<FingerId, FingerDesign> {
  const out = {} as Record<FingerId, FingerDesign>
  for (const f of FINGER_ORDER) {
    out[f] = { ...defaultFinger(), ...template.fingers[f] }
  }
  return out
}
