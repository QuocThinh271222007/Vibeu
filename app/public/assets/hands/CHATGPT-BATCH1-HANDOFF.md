# ChatGPT hand-variant asset handoff — Batch 1

Target branch: `fix/vibeu-visual-asset-ux-corrective`
Date: 2026-09-04

## Assets prepared by ChatGPT

This batch contains the 6 highest-priority medium-length hand variants requested by `VARIANT-ASSET-GUIDE.md`:

### Cozy / light skin / dusty-pink background
- `cozy/variants/square-M/base.jpg`
- `cozy/variants/almond-M/base.jpg`
- `cozy/variants/coffin-M/base.jpg`

### Matcha / warm skin / soft-grey background
- `matcha/variants/square-M/base.jpg`
- `matcha/variants/almond-M/base.jpg`
- `matcha/variants/coffin-M/base.jpg`

The generated source images are portrait 2:3 and have production-size 933×1400 JPEG candidates available in the ChatGPT working set.

## Review pack currently committed to Git

Before production integration, six **review-only** WebP previews are committed here so the coding agent can inspect the visual character of the generated hands and audit the compositor:

```text
app/public/assets/hands/_chatgpt-review/batch1/cozy-square-M.webp
app/public/assets/hands/_chatgpt-review/batch1/cozy-almond-M.webp
app/public/assets/hands/_chatgpt-review/batch1/cozy-coffin-M.webp
app/public/assets/hands/_chatgpt-review/batch1/matcha-square-M.webp
app/public/assets/hands/_chatgpt-review/batch1/matcha-almond-M.webp
app/public/assets/hands/_chatgpt-review/batch1/matcha-coffin-M.webp
```

These previews are 256×384 WebP and are **not** production `base.jpg` files. Do not move/rename them into the variant runtime paths and do not calibrate against these reduced previews. Their purpose is compositor/photorealism review only.

### Agent action now

Pull this branch, inspect the six review images together with the current nail compositor, then report back **before asking for more generated assets** whether ChatGPT needs to generate or author any additional contrast/reflection/shading maps. The requested analysis is specified below.

## IMPORTANT: do not enable HAND_VARIANTS until calibration

The new hand photos must not be registered merely because an image exists. Every production variant requires its own calibrated `coordinates.json` first.

For each final production `base.jpg` create:

```text
app/public/assets/hands/<tone>/variants/<shape>-M/coordinates.json
```

Use Studio's Debug overlay to trace the real nail beds and verify the paint overlay on the actual full-resolution image. Do not simply copy the coordinates from the default hand.

Only after production-image calibration and visual verification, enable exactly these six keys in `app/src/data/handVariants.ts`:

```ts
cozy: {
  'square-M': true,
  'almond-M': true,
  'coffin-M': true,
},
matcha: {
  'square-M': true,
  'almond-M': true,
  'coffin-M': true,
},
```

## Required visual QA after production integration

Verify all six variants in Studio and in exported PNG output:

1. all five paint masks align with the real nail beds;
2. recoloring does not spill onto cuticles or skin;
3. photographic highlights remain believable after recoloring;
4. mixed shape/length selections still fall back to the default hand photo;
5. setting all five fingers to one supported shape + `M` switches to the correct photo;
6. there is no grey wedge, seam, clipping, or fake 2D-shape artifact.

## Agent review requested: are additional photorealism assets needed?

Before asking ChatGPT to generate more shape/length photos, inspect the current compositor and explicitly report whether the existing renderer is sufficient or whether additional reusable/per-variant maps would materially improve realism.

Please specifically evaluate:

- specular / reflection highlight mask;
- gloss / roughness variation map;
- nail-local contrast or luminance map;
- ambient-occlusion / cuticle contact-shadow mask;
- edge / curvature shading mask;
- normal-like directional shading helper;
- separate highlight layer that survives arbitrary polish recoloring;
- any other asset needed for dark, bright, metallic, translucent, chrome, or high-gloss colors.

Do **not** add auxiliary maps just because they sound useful. First inspect the real implementation (`geometry`, nail paint/compositor path, blend modes and preservation of the source photograph), then report:

1. which visual effects are already preserved from the real base photograph;
2. which effects are synthesized in code;
3. which photographic information is lost during recoloring;
4. exactly which additional asset(s), if any, would improve realism enough to justify the complexity.

If extra assets are required, send the user/ChatGPT a precise generation or authoring brief including:

- expected file format;
- dimensions;
- grayscale/color semantics;
- blending mode / mathematical use;
- whether it is per-hand, per-nail, per-shape, per-length, or globally reusable.

## Suggested next image batch

Do not request the next batch until the compositor review above is complete. If no new auxiliary asset type is needed, the next priority is:

- `cozy/oval-S`
- `cozy/oval-L`
- `matcha/oval-S`
- `matcha/oval-L`

Then fill the remaining shape × length matrix.
