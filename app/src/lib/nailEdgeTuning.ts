import type { FingerId, SkinToneId } from '@/types/vibeu'

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
  cozy: { thumb: 12, index: 4, middle: 4, ring: 4, little: 9 },
  matcha: { thumb: 3, index: 3, middle: 3, ring: 3, little: 3 },
}

export function maskGrowPxFor(tone: SkinToneId | undefined, fingerId: FingerId): number {
  if (!tone) return 0
  return MASK_GROW_PX[tone]?.[fingerId] ?? 0
}
