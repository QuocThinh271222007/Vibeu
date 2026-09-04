# Hand-photo variant asset guide (for generating new base photos)

## Why this exists

VIBEU's Studio paints nail colors onto a **real photographed hand**, not a vector
drawing — that's what makes the result look photorealistic. Today there are only
**2 base hand photos** in the whole app:

- `public/assets/hands/cozy/base.jpg` — "Da Sáng" (light skin tone)
- `public/assets/hands/matcha/base.jpg` — "Da Ấm" (warm skin tone)

Both photos happen to show nails in roughly the same shape (rounded/almond-ish) and
the same medium length. So today, choosing a different **Form móng** (shape) or
**Độ dài** (length) in Studio only changes stored data — it can't visually change
the photo, because there is no second photo of that same hand with, say, real
square nails or real long nails. Warping the one photo we have was tried and
rejected (see the comments on `LENGTH_SCALE`/`shapeTrimUv` in
`src/lib/geometry.ts`) — a 2D warp of a real photo produces obvious fake-looking
grey wedges and broken masks.

**The real fix: more real photos.** `src/data/handVariants.ts` already has the code
wired up so that when all 5 fingers share the same shape + length, Studio
automatically switches to a matching photo — *if one has been added*. This guide
is what to hand an AI image generator (ChatGPT Image or similar) to produce those
photos in the same visual style as the 2 that already exist, so they slot in
seamlessly.

## Exact style brief (matched to the 2 existing reference photos)

Describe this to the image generator for every new photo:

- **Framing/pose**: An extreme close-up of one hand, fingers gently curled/folded
  toward the camera so all 5 fingernail tops are clearly visible face-on (not a
  flat splayed-open hand). Portrait orientation, roughly 2:3 aspect ratio
  (existing photos are ~1024×1536 / 1023×1537 px).
- **Crop**: Hand fills most of the frame; wrist area is visible at the bottom
  wearing a soft knit sweater cuff (cream/oatmeal color) that's clearly visible
  in-frame — this framing detail repeats in both existing photos.
- **Background**: A plain, softly out-of-focus studio backdrop in one flat pastel
  tone — dusty pink for the "cozy" tone, soft grey for the "matcha" tone. Shallow
  depth of field (background clearly blurred, hand in sharp focus).
- **Lighting**: Soft, diffused studio light from the upper-left, warm and gentle —
  no harsh shadows, no visible light source, gentle falloff across the fingers.
  Skin should show natural texture (visible knuckle creases, no over-smoothing).
- **Nails**: Glossy, evenly-painted solid-color polish (color doesn't matter — it
  gets replaced programmatically — muted sage green or nude works well since
  that's what the reference photos use), clean cuticle line, a visible soft
  specular highlight streak down each nail (real glossy-polish reflection, not a
  flat cartoon highlight).
- **Realism**: Must read as a real photograph (or photoreal AI render) of a real
  hand — not illustrated, not stylized, not obviously AI-artifacted (watch for
  extra/fused fingers, warped nail beds, mismatched hand anatomy — regenerate if
  so).
- **What must change per variant**: ONLY the nail shape and/or length, per the
  table below. Everything else (pose, crop, lighting, background, skin) should
  stay as close as possible to the 2 existing photos so the new photo reads as
  "the same photoshoot, different manicure."

## Shape/length reference (so the generated nails match what each label means)

| App label (VI) | Code id | Shape description for the prompt |
|---|---|---|
| Oval | `oval` | Rounded taper to a soft point — **this is what the 2 existing photos already show**, no new photo needed for this shape at length M. |
| Vuông | `square` | Straight flat tip, sharp square corners, no rounding. |
| Coffin | `coffin` | Long tapered sides to a flat (not pointed) squared-off tip — "ballerina" shape. |
| Nhọn | `almond` | Narrow tapered sides to a rounded point, longer and narrower than oval. |

| App label | Code id | Length description |
|---|---|---|
| S | `S` | Short — polish stops close to the fingertip, barely extends past the fingerbed. |
| M | `M` | Medium — matches the 2 existing reference photos exactly. |
| L | `L` | Long — extends noticeably past the fingertip. |

## What to generate, and priority order

Full matrix is 4 shapes × 3 lengths × 2 tones = 24 combinations, minus the 2 that
already exist (`oval`+`M` for both tones) = **22 new photos**. That's a lot — you
don't have to do all of them at once. Suggested order, most-used first:

1. `square`-`M` and `almond`-`M` and `coffin`-`M` (both tones) — the 3 missing
   shapes at the existing default length. **6 photos.**
2. `oval`-`S` and `oval`-`L` (both tones) — length variety on the shape that
   already works. **4 photos.**
3. The remaining 12 combinations, as needed.

## Prompt template (fill in the bracketed parts per photo)

```
Extreme close-up photo of one hand with [SHAPE DESCRIPTION] manicured
fingernails, fingers gently curled toward the camera so all 5 nail tops are
visible face-on. [LENGTH DESCRIPTION]. Glossy solid sage-green nail polish,
clean cuticles, soft specular highlight on each nail. [SKIN TONE: light/fair OR
warm/tan] skin with natural texture and visible knuckle creases. Soft diffused
studio lighting from the upper-left, no harsh shadows. Plain out-of-focus
[dusty pink OR soft grey] studio background, shallow depth of field. Cream knit
sweater cuff visible at the wrist. Portrait orientation, photorealistic, shot on
a mirrorless camera with a macro lens.
```

## After generating: file placement + calibration

1. Save the chosen final image as JPEG, resize so the longest side is ~1400px
   (matches how the existing curated covers are processed), and place it at:
   ```
   public/assets/hands/<tone>/variants/<shape>-<length>/base.jpg
   ```
   e.g. `public/assets/hands/cozy/variants/square-M/base.jpg`

2. **The photo alone isn't enough** — Studio needs to know exactly where each
   fingernail sits in the new photo (a traced outline + coordinate frame per
   finger, see `coordinates.json` format in `src/types/vibeu.ts`'s `NailCoord`).
   This calibration has to be done by hand against the actual new photo — hand
   this photo to Claude (or whoever is doing the calibration) together with a
   request to calibrate `coordinates.json` for it, using the in-app debug overlay
   (Studio's "Debug" button — shows a live image-pixel/UV readout under the
   cursor, exactly built for tracing new nail regions) to verify alignment.

3. Once both files exist, add one line to `src/data/handVariants.ts`'s
   `HAND_VARIANTS` object:
   ```ts
   cozy: { 'square-M': true },
   ```
   That's it — Studio and the exported PNG/QR flow will pick it up automatically
   the next time all 5 fingers are set to that shape + length.
