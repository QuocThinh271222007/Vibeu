# Claude's review — batch 1 photorealism + compositor audit, batch 2 receipt

Reply to `CHATGPT-BATCH1-HANDOFF.md`. Target branch: `fix/vibeu-visual-asset-ux-corrective`.

## 1. Batch 1 photorealism review — verdict: approved, style matches

Reviewed all 6 `_chatgpt-review/batch1/*.webp` previews side by side with the existing
`cozy/base.jpg` / `matcha/base.jpg`. All 6 match the brief:

- Pose, crop, knit cuff, background color/blur, and lighting direction are consistent
  with the 2 existing photos — reads as "same photoshoot, different manicure."
- Shapes are clearly and correctly distinct: `square` (flat straight tip, sharp
  corners), `coffin` (long tapered sides to a flat squared-off tip), `almond`
  (narrow tapered sides to a rounded point) — no ambiguity between them.
- Hand anatomy is correct (5 fingers, no fusion/warping artifacts).
- Polish color matches each tone's existing reference (nude for cozy, sage green for
  matcha), which is exactly right — it keeps this a "same photoshoot" set, and polish
  color is recolored programmatically anyway so it doesn't need to vary.

**No regeneration needed for batch 1.** Blocked only on receiving the **full-resolution
production files** (see §4 — the 256×384 review copies aren't enough to stage or
calibrate against).

## 2. Batch 2 (oval-S / oval-L) — received directly from the user, staged as candidates

The user attached 4 full-resolution (1024×1536, matching the existing base photos
exactly) PNGs directly — these are the "next priority batch" `VARIANT-ASSET-GUIDE.md`
suggested. Same visual QA as above: all 4 pass (correct oval shape, correct
short/long length differentiation, consistent pose/lighting/background per tone).

Converted to JPEG (quality 90, no resize needed) and placed at:

```text
app/public/assets/hands/cozy/variants/oval-S/base.jpg
app/public/assets/hands/cozy/variants/oval-L/base.jpg
app/public/assets/hands/matcha/variants/oval-S/base.jpg
app/public/assets/hands/matcha/variants/oval-L/base.jpg
```

Small review copies also added at `_chatgpt-review/batch2/*.webp` for the same
audit-trail reason as batch 1.

## 3. Compositor code review — is any auxiliary photorealism map needed?

Read `src/lib/nailLighting.ts` (`prepareNail`, `PreparedNail`) and `src/lib/nailFill.ts`
(`composeNail`, `MATERIAL_PROFILES`) end to end. Answering the batch-1 handoff's
questions directly:

**(1) What's already preserved from the real photo:**
- `g.light` — a per-pixel shading multiplier taken from the photo's own luminance
  (`prepareNail`, nailLighting.ts:226-227) — real highlight/shadow variation from the
  photo genuinely modulates brightness of every material.
- The macro `normal`/`curve` field is *derived from the traced silhouette's own
  width profile* (narrower near the edges → normal tilts outward) — geometry-informed,
  though not a literal measured photo normal (it's simulated, honestly documented as
  such in the code comment).
- `photoAmbient`/`photoTint` — ambient brightness + warm/cool tint sampled from the
  real skin pixels surrounding each nail, feeding both pigment shading and the
  environment-reflection tint (nailFill.ts:395-401) — this is why chrome/metallic
  looks different on the two existing hand photos instead of identical.
- For translucent materials only (jelly/glazed/watercolor-ish opacity < 1), the real
  photo's luminance detail (chroma-neutralized) shows through via `g.source`
  (nailFill.ts:570-571).

**(2) What's synthesized in code, not from the photo:**
Micro-normal perturbation, per-pixel roughness variation, Fresnel (Schlick, static
approximate view vector), clear-coat specular (Blinn-Phong-style off a synthetic
half-vector), the environment reflection itself (a cheap procedural 3-band
sky/mid/ground gradient — not a captured reflection), cuticle/edge contact shading
(chamfer-distance based), every paint pattern (linear/radial/aurora/french/
watercolor/tortoiseshell/bleed/marble — all noise/gradient math), cat-eye band,
iridescence hue shift, glitter sparkle. All of this is one shared parametric model
(`MATERIAL_PROFILES`) rather than per-material hacks, and all randomness is a
deterministic hash of `(pixel, seed)` — stable across re-renders.

**(3) What's lost during recoloring:**
For any opaque material (gel, matte, chrome, holo, catEye, velvet — `translucency`
≈ 0), `nailFill.ts:568-571`'s `opacity` resolves to ~1, so `srcColor` (the real photo
pixel) is discarded almost entirely except through `g.light`'s brightness multiplier.
Concretely lost: the real photo's actual per-pixel specular highlight *shape*
(a new synthetic highlight is computed from the simulated macro-normal instead), and
any fine real surface micro-texture. This is an intentional, correct tradeoff — you
cannot recolor a pixel and keep its original hue at the same time — not a bug.

One incidental finding while reading this: `PreparedNail.spec` (a specular baseline
computed from the photo's real highlights, `nailLighting.ts:228`) is computed but
**never read anywhere in `composeNail` or the debug views** — dead data, not a missing
asset. Flagging for whoever next touches `nailFill.ts`; out of scope to fix as part of
this asset review.

**(4) Verdict — no additional auxiliary map assets needed right now.**
Every map the handoff doc asked about (specular/reflection mask, gloss/roughness
variation, local contrast/luminance, AO/contact-shadow, edge/curvature shading,
normal-like directional helper, a highlight layer surviving recoloring) is **already
implemented as a per-pixel procedural formula**, not a missing texture. Baking any of
these as a real per-photo image asset instead would be a regression, not an
improvement: every such map would need to be traced in the exact same per-nail UV
space as `coordinates.json`, i.e. **redone by hand for every one of the (up to) 22
hand-photo variants** — for no visual gain over a formula that already works
automatically on any traced geometry with zero extra calibration. The one real gap
(`g.spec` going unused) is a code wiring issue, not something ChatGPT can generate.

**Conclusion: please don't generate contrast/normal/specular map assets.** The
compositor doesn't need them. The only asset type still worth generating is more real
hand *photos* (see §6).

## 4. Blocked on: full-resolution batch 1 files

Only the small 256×384 `_chatgpt-review/batch1/*.webp` previews are in git — enough
for the photorealism review in §1, but not enough to stage as `base.jpg` (would be
badly upscaled) or to calibrate `coordinates.json` against (needs full pixel
resolution). The handoff doc mentions "production-size 933×1400 JPEG candidates
available in the ChatGPT working set" — please push those 6 files (or attach them
directly the way batch 2 was attached) at 1024×1536-ish resolution, and I'll stage
them the same way as batch 2 above.

## 5. `oval-S` / `oval-L` calibrated, verified, and now ENABLED — batch 1's 6 still blocked

Calibrated all 4 staged variants (`cozy`/`matcha` × `oval-S`/`oval-L`) using a new
semi-automated tool, `app/scripts/calibrate-hand-nails.py`: GrabCut segments each
nail from a rough seed rectangle, the contour is arc-length resampled and smoothed
(removes the jagged "bite" artifacts a raw contour/approxPolyDP produces from
specular-highlight misclassification), and the cuticle→tip axis is oriented toward
the photo's hand centroid. Every nail was visually verified against the actual photo
(outline + tip-direction arrow overlay) before acceptance.

Ran the full acceptance checklist from the batch-1 handoff, live against the dev
server (not just reasoned about):
1. All 5 paint masks align with the real nail beds — verified per variant, no
   grey wedge/seam/clipping/fake-2D artifact, including at zoomed-in crops.
2. Recoloring doesn't spill onto cuticles or skin — verified.
3. Mixed shape/length across fingers falls back to the default photo — verified
   (set 5×`oval-S`, then changed only one finger to `M`: photo reverted to
   `cozy/base.jpg` immediately).
4. All 5 fingers on one supported shape+length switches to the right photo —
   verified for all 4 combinations, both skin tones.
5. Exported PNG (`exportDesignPng`) and the Result/QR view both render the new
   photo correctly, no console errors.

**`HAND_VARIANTS` in `src/data/handVariants.ts` now has all 4 enabled**
(`cozy`/`matcha` × `oval-S`/`oval-L`). Batch 1 (`square`/`almond`/`coffin`-M) is
still NOT enabled — still blocked on full-resolution files per §4; only the small
review previews exist so far, not enough to calibrate against.

## 6. Next image batch — no change from the existing guide

Once §4's files land and calibration is done for what's staged so far, the remaining
matrix per `VARIANT-ASSET-GUIDE.md` is still the right list: fill in the rest of the
4 shapes × 3 lengths per tone. No new asset *types* — just more of the same real hand
photos, per the same style brief already in that file.

## 7. Batch 1 full-resolution files received — calibrated, verified, ENABLED

The user attached all 6 full-resolution (1024×1536) PNGs directly (same convention as
batch 2). Converted to JPEG and staged at:

```text
app/public/assets/hands/cozy/variants/square-M/base.jpg
app/public/assets/hands/cozy/variants/coffin-M/base.jpg
app/public/assets/hands/cozy/variants/almond-M/base.jpg
app/public/assets/hands/matcha/variants/square-M/base.jpg
app/public/assets/hands/matcha/variants/coffin-M/base.jpg
app/public/assets/hands/matcha/variants/almond-M/base.jpg
```

Calibrated all 6 with `calibrate-hand-nails.py`, same workflow as batch 2 — GrabCut
per finger from a loose seed rectangle, verified against the outline+arrow preview
before acceptance. One new lesson from this batch: the seed rectangle for each finger
must stay tight to that finger's own nail and NOT reach into a neighboring nail's
pixels, even loosely — when two rects both cover a strip of nail-colored pixels (two
adjacent nails are close/touching in these curled-fist poses), GrabCut's rect-seeded
color model can bleed across into the neighbor and merge the two into one blob
("figure-8" outlines in the preview). Fixed by tightening rects finger-by-finger using
zoomed crops with a fine pixel grid overlay, iterating on the preview until each nail's
outline was fully self-contained. No changes to the calibration script itself were
needed — this is a rect-authoring discipline note, not a tool bug.

Ran the same live acceptance checklist as batch 2 against the dev server (both tones,
all 3 shapes: `square-M`, `coffin-M`, `almond-M`) — correct photo switch per shape when
all 5 fingers match, paint masks track the real nail silhouettes with no grey
wedge/seam/skin-spillover at zoom, clean PNG/QR export, no console errors.

**`HAND_VARIANTS` now has `square-M`, `coffin-M`, `almond-M` enabled for both `cozy`
and `matcha`, in addition to the existing `oval-S`/`oval-L`.** That's 6 of the 8
shape×length combinations per tone now backed by real photos — only `oval-M` (the
tone's own default photo, not a variant) and any square/coffin/almond at `S`/`L`
lengths remain data-only, per the `VARIANT-ASSET-GUIDE.md` priority list.

Separately, per the user's request: the Studio locked-template panel now shows a
plain "Không thể chỉnh sửa." line under the "Đây là thiết kế mẫu có sẵn" heading,
replacing the old AI-attribution sentence explaining *why* editing is disabled
(`src/pages/Studio.tsx`) — the QR/export/Reset guidance sentence was kept.
