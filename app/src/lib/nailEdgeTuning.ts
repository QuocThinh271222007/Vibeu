import type { FingerId, NailLength, NailShape, SkinToneId } from '@/types/vibeu'

/**
 * Per-(tone, finger) outward growth of the paintable nail region, in image-space pixels
 * (same units as NailCoord.bbox). Exists because the hand-traced `nail.path` for a few
 * finger/tone combinations sits slightly inside the real photographed nail's own edge —
 * confirmed empirically (not guessed): reducing the inward coverage-erosion feather to
 * near-zero left the same visible sliver of real, unpainted nail in the same place and at
 * the same width, which rules out erosion/blending as the cause and means the traced
 * path itself needs to grow to reach the real nail edge, not just blend more tightly.
 *
 * `0` (the default for every unlisted finger) means the traced path is trusted as-is.
 * This must be applied consistently in THREE places for a given nail, or the paint and
 * the visible clip region disagree:
 *   1. nailLighting.ts's prepareNail() — extends alpha/normal/light coverage outward so
 *      the newly-included band actually has valid painted pixels, not transparent ones.
 *   2. HandCanvas.tsx's live SVG clipPath — the outer clip is `nail.path` itself; without
 *      growing it too, the extra painted pixels from (1) would just be clipped away.
 *   3. exportImage.ts's canvas clip — same reasoning, so the exported PNG matches the
 *      live preview exactly.
 */
export const MASK_GROW_PX: Partial<Record<SkinToneId, Partial<Record<FingerId, number>>>> = {
  // Round 2 of tuning per direct user feedback after reviewing the live site: thumb
  // still showed a visible leftover rim at 7px (bumped to 12), little's was down to a
  // very small remainder at 7px (bumped to 9), and index/middle/ring — previously
  // untouched — turned out to have their own small gap too ("chưa khớp lắm, vẫn còn
  // thiếu một chút").
  // Round 3: thumb STILL showed a leftover rim at 12px (visible along the right edge
  // and lower curve at 400%+ zoom) — bumped further to 20.
  cozy: { thumb: 15, index: 4, middle: 4, ring: 4, little: 9 },
  matcha: { thumb: 3, index: 3, middle: 3, ring: 3, little: 3 },
}

/**
 * The calibrated real-photo variants already trace their visible nail edge.  Reusing the
 * much larger correction measured for the original Oval-M photos makes long/square nails
 * bleed onto skin (most visibly the cozy thumb).  Keep just a small anti-rim allowance for
 * variant photos while preserving the proven Oval-M values byte-for-byte and visually.
 */
const VARIANT_MASK_GROW_PX: Record<SkinToneId, number> = { cozy: 1.5, matcha: 1.5 }

// Variants enter this set only after a five-finger, high-resolution screenshot pass.
// Their paths sit on the photographed nail boundary, so the legacy 4.5px+ inward
// feather would reveal a conspicuous ring of the source polish and make a correct path
// look undersized.  A tight 1.5px antialias keeps the edge natural without moving it.
const PIXEL_CALIBRATED_VARIANTS = new Set<string>([
  'cozy:oval-S',
  'cozy:square-S',
  'cozy:coffin-S',
  'cozy:almond-S',
  'cozy:square-M',
  'cozy:coffin-M',
  'cozy:almond-M',
  'cozy:oval-L',
  'cozy:square-L',
  'cozy:coffin-L',
  'cozy:almond-L',
])

// These three longer silhouettes retain a one-pixel source-polish rim after the
// standard variant allowance.  The extra pixel was checked on every finger at 3x;
// it reaches the photographed edge without crossing the cuticle or sidewall.
const PIXEL_CALIBRATED_GROW_PX: Partial<Record<string, number>> = {
  'cozy:almond-M': 2.5,
  'cozy:oval-L': 2.5,
  'cozy:square-L': 2.5,
  'cozy:coffin-L': 2.5,
  'cozy:almond-L': 2.5,
}

export function maskFeatherPxFor(
  tone: SkinToneId | undefined,
  photoShape: NailShape | undefined,
  photoLength: NailLength | undefined,
  fallbackPx: number,
): number {
  if (!tone || !photoShape || !photoLength) return fallbackPx
  return PIXEL_CALIBRATED_VARIANTS.has(`${tone}:${photoShape}-${photoLength}`) ? 1.5 : fallbackPx
}

export function maskGrowPxFor(
  tone: SkinToneId | undefined,
  fingerId: FingerId,
  photoShape?: NailShape,
  photoLength?: NailLength,
): number {
  if (!tone) return 0
  const isCalibratedVariant = photoShape != null && photoLength != null && !(photoShape === 'oval' && photoLength === 'M')
  if (isCalibratedVariant) {
    const variantKey = `${tone}:${photoShape}-${photoLength}`
    return PIXEL_CALIBRATED_GROW_PX[variantKey] ?? VARIANT_MASK_GROW_PX[tone]
  }
  return MASK_GROW_PX[tone]?.[fingerId] ?? 0
}
