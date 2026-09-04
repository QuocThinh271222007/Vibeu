import type { NailLength, NailShape, SkinToneId } from '@/types/vibeu'

export type HandVariantKey = `${NailShape}-${NailLength}`

/**
 * Registry of extra photographed hand-base variants beyond each skin tone's default
 * (oval/M) photo — e.g. a real photo of a hand manicured with square nails, or with
 * longer nails, so picking "Vuông"/"L" in Studio can show an actually-different photo
 * instead of only changing stored recipe data (see LENGTH_SCALE/shapeTrimUv in
 * geometry.ts for why a single photo can't be warped into a different shape/length —
 * this variant-photo system is the real fix for that limitation).
 *
 * Populate an entry here ONLY after both of these exist on disk:
 *   public/assets/hands/<tone>/variants/<shape>-<length>/base.jpg
 *   public/assets/hands/<tone>/variants/<shape>-<length>/coordinates.json  (hand-calibrated)
 * Until then, that combination silently falls back to the tone's default base photo —
 * exactly today's behavior — so this file starts empty and is safe to ship as-is.
 *
 * See public/assets/hands/VARIANT-ASSET-GUIDE.md for the photo brief (pose/lighting/
 * contrast spec matched to the 2 existing reference photos) to hand an image generator,
 * plus the calibration workflow for turning a new photo into a coordinates.json.
 */
export const HAND_VARIANTS: Partial<Record<SkinToneId, Partial<Record<HandVariantKey, true>>>> = {
  cozy: {},
  matcha: {},
}

export function hasHandVariant(tone: SkinToneId, shape?: NailShape, length?: NailLength): boolean {
  if (!shape || !length) return false
  return Boolean(HAND_VARIANTS[tone]?.[`${shape}-${length}`])
}

/** Folder segment to use under public/assets/hands/<tone>/ — either "variants/<shape>-<length>" when a real photo exists, or "" for the tone's default photo. */
export function handVariantSegment(tone: SkinToneId, shape?: NailShape, length?: NailLength): string {
  return hasHandVariant(tone, shape, length) ? `variants/${shape}-${length}` : ''
}
