import type { PreparedNail } from '@/lib/nailLighting'
import type { ColorPreset, CustomGradient, EffectId } from '@/types/vibeu'

export interface PaintConfig {
  mode: 'linear' | 'radial' | 'aurora' | 'solid'
  stops: { at: number; color: string }[]
  start: [number, number]
  end: [number, number]
  opacity: number
}

export interface MaterialConfig {
  type: EffectId
  gloss: number
  roughness: number
  glitter: number
  catAngle: number
}

export interface LightState {
  angle: number
  elevation: number
  strength: number
  ambient: number
  photo: number
}

/** A soft, slightly top-left key light — matches the natural light in the stock hand photos. */
export const DEFAULT_LIGHT: LightState = { angle: -45, elevation: 62, strength: 0.5, ambient: 0.88, photo: 0.7 }

export function buildPaintConfig(preset: ColorPreset, customColor: string | null, customGradient?: CustomGradient | null): PaintConfig {
  if (customColor) {
    return { mode: 'solid', stops: [{ at: 0, color: customColor }], start: [0.5, 0], end: [0.5, 1], opacity: 1 }
  }
  if (customGradient) {
    return { mode: customGradient.mode, stops: customGradient.stops, start: customGradient.start, end: customGradient.end, opacity: 1 }
  }
  const { paint } = preset
  return { mode: paint.mode, stops: paint.stops, start: paint.start, end: paint.end, opacity: paint.opacity }
}

export function buildMaterialConfig(preset: ColorPreset, effect: EffectId): MaterialConfig {
  const { material } = preset
  return { type: effect, gloss: material.gloss, roughness: material.roughness, glitter: material.glitter, catAngle: material.catAngle }
}

// ---------------------------------------------------------------------------
// Material profile model
//
// Every supported finish is a point in ONE shared parameter space (roughness,
// Fresnel base reflectance, clear-coat strength/roughness, metallic response,
// translucency, micro-normal strength, per-pixel roughness variation,
// environment-reflection strength, glitter density, iridescence, cat-eye
// band strength) rather than bespoke per-material formulas. `resolveMaterialProfile`
// nudges the base profile using the per-preset gloss/roughness/glitter/catAngle
// values already authored in the color pack, so a preset still has *some*
// influence, but the chosen finish is what determines the material's optical
// character.
// ---------------------------------------------------------------------------

export interface NailMaterialProfile {
  roughness: number // 0 = mirror-smooth, 1 = fully diffuse
  fresnelF0: number // reflectance at normal incidence (Schlick base)
  clearcoat: number // 0..1 strength of the top-coat specular layer
  clearcoatRoughness: number // 0..1, widens/softens the clear-coat highlight
  metallic: number // 0..1, how much the environment-reflection color multiplies into the base pigment
  translucency: number // 0..1, how much of the real photo shows through the pigment
  microNormalStrength: number
  roughnessVariation: number
  environmentReflection: number // 0..1 strength of the environment-gradient reflection
  glitterDensity: number
  iridescence: number // 0..1 strength of the holographic hue shift
  catEyeStrength: number
}

const MATERIAL_PROFILES: Record<EffectId, NailMaterialProfile> = {
  gel: {
    roughness: 0.16,
    fresnelF0: 0.05,
    clearcoat: 0.85,
    clearcoatRoughness: 0.08,
    metallic: 0,
    translucency: 0,
    microNormalStrength: 0.05,
    roughnessVariation: 0.03,
    environmentReflection: 0.15,
    glitterDensity: 0,
    iridescence: 0,
    catEyeStrength: 0,
  },
  jelly: {
    roughness: 0.22,
    fresnelF0: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.11,
    metallic: 0,
    translucency: 0.45,
    microNormalStrength: 0.05,
    roughnessVariation: 0.03,
    environmentReflection: 0.12,
    glitterDensity: 0,
    iridescence: 0,
    catEyeStrength: 0,
  },
  matte: {
    roughness: 0.78,
    fresnelF0: 0.025,
    clearcoat: 0.12,
    clearcoatRoughness: 0.55,
    metallic: 0,
    translucency: 0.05,
    microNormalStrength: 0.16,
    roughnessVariation: 0.12,
    environmentReflection: 0.04,
    glitterDensity: 0,
    iridescence: 0,
    catEyeStrength: 0,
  },
  chrome: {
    roughness: 0.05,
    fresnelF0: 0.6,
    clearcoat: 0.3,
    clearcoatRoughness: 0.04,
    metallic: 0.92,
    translucency: 0,
    microNormalStrength: 0.008,
    roughnessVariation: 0.008,
    environmentReflection: 0.9,
    glitterDensity: 0,
    iridescence: 0,
    catEyeStrength: 0,
  },
  glitter: {
    roughness: 0.32,
    fresnelF0: 0.05,
    clearcoat: 0.7,
    clearcoatRoughness: 0.16,
    metallic: 0.12,
    translucency: 0.05,
    microNormalStrength: 0.4,
    roughnessVariation: 0.28,
    environmentReflection: 0.2,
    glitterDensity: 0.55,
    iridescence: 0,
    catEyeStrength: 0,
  },
  holo: {
    roughness: 0.14,
    fresnelF0: 0.08,
    clearcoat: 0.75,
    clearcoatRoughness: 0.08,
    metallic: 0.28,
    translucency: 0.05,
    microNormalStrength: 0.06,
    roughnessVariation: 0.04,
    environmentReflection: 0.32,
    glitterDensity: 0,
    iridescence: 0.55,
    catEyeStrength: 0,
  },
  catEye: {
    roughness: 0.18,
    fresnelF0: 0.05,
    clearcoat: 0.8,
    clearcoatRoughness: 0.08,
    metallic: 0.05,
    translucency: 0.05,
    microNormalStrength: 0.05,
    roughnessVariation: 0.03,
    environmentReflection: 0.15,
    glitterDensity: 0.2,
    iridescence: 0,
    catEyeStrength: 1,
  },
}

interface ResolvedProfile extends NailMaterialProfile {
  catEyeAngleDeg: number
}

function resolveMaterialProfile(material: MaterialConfig): ResolvedProfile {
  const base = MATERIAL_PROFILES[material.type] ?? MATERIAL_PROFILES.gel
  const glossAdj = 1.4 - clamp(material.gloss, 0, 1) * 0.8 // preset gloss nudges roughness down
  const roughness = clamp(base.roughness * glossAdj, 0.03, 0.95)
  const glitterDensity = base.glitterDensity > 0 || material.type === 'glitter' ? Math.max(base.glitterDensity, material.glitter) : 0
  return { ...base, roughness, glitterDensity, catEyeAngleDeg: material.catAngle }
}

// ---------------------------------------------------------------------------
// Decals — composited BELOW the clear-coat pass, warped by the nail's own
// measured curvature field so flat artwork visually wraps the surface.
// ---------------------------------------------------------------------------

export interface DecalPixels {
  data: Uint8ClampedArray
  width: number
  height: number
}

export interface DecalLayer {
  pixels: DecalPixels
  /** [x, y, w, h] in 0..1 of the image — the actual (non-transparent-padding) content region. */
  contentBounds: [number, number, number, number]
  centerX: number // image-space px (same coordinate system as PreparedNail.x/y)
  centerY: number
  widthPx: number // rendered footprint width, image-space px
  heightPx: number
  rotationDeg: number
  flipX: boolean
  opacity: number
  tint: [number, number, number] | null
  /** 0..1 — how strongly this decal bends with the nail's curvature. 0 = rigid flat sticker. */
  curvature: number
  layerType: 'decal' | 'foil' | 'raised'
}

function sampleBilinear(px: DecalPixels, x: number, y: number): [number, number, number, number] {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const fx = x - x0
  const fy = y - y0
  const at = (xx: number, yy: number): [number, number, number, number] => {
    if (xx < 0 || yy < 0 || xx >= px.width || yy >= px.height) return [0, 0, 0, 0]
    const i = (yy * px.width + xx) * 4
    return [px.data[i], px.data[i + 1], px.data[i + 2], px.data[i + 3]]
  }
  const c00 = at(x0, y0)
  const c10 = at(x0 + 1, y0)
  const c01 = at(x0, y0 + 1)
  const c11 = at(x0 + 1, y0 + 1)
  const out: [number, number, number, number] = [0, 0, 0, 0]
  for (let i = 0; i < 4; i++) {
    const top = c00[i] * (1 - fx) + c10[i] * fx
    const bot = c01[i] * (1 - fx) + c11[i] * fx
    out[i] = top * (1 - fy) + bot * fy
  }
  return out
}

// ---------------------------------------------------------------------------
// Shared numeric helpers
// ---------------------------------------------------------------------------

function clamp(v: number, a = 0, b = 1): number {
  return Math.min(b, Math.max(a, v))
}

function smoothstep01(a: number, b: number, v: number): number {
  const t = clamp((v - a) / (b - a || 1))
  return t * t * (3 - 2 * t)
}

export function hexToRgb01(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255) as [number, number, number]
}

function mix3(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] * (1 - t) + b[0] * t, a[1] * (1 - t) + b[1] * t, a[2] * (1 - t) + b[2] * t]
}

function norm3(v: [number, number, number]): [number, number, number] {
  const l = Math.hypot(v[0], v[1], v[2]) || 1
  return [v[0] / l, v[1] / l, v[2] / l]
}

function stopSampler(stops: { at: number; color: string }[]) {
  const sorted = stops
    .slice()
    .sort((a, b) => a.at - b.at)
    .map((s) => ({ at: s.at, rgb: hexToRgb01(s.color) }))
  return (t: number): [number, number, number] => {
    if (t <= sorted[0].at) return sorted[0].rgb
    for (let i = 1; i < sorted.length; i++) {
      if (t <= sorted[i].at) {
        const span = sorted[i].at - sorted[i - 1].at || 1
        return mix3(sorted[i - 1].rgb, sorted[i].rgb, clamp((t - sorted[i - 1].at) / span))
      }
    }
    return sorted[sorted.length - 1].rgb
  }
}

/** Deterministic pseudo-random in [0,1) — stable across re-renders, never time-seeded. */
function hash(x: number, y: number, s = 1): number {
  const a = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453
  return a - Math.floor(a)
}

function fresnelSchlick(f0: number, ndotv: number): number {
  return f0 + (1 - f0) * Math.pow(1 - clamp(ndotv), 5)
}

/** Cheap 3-band sky/mid/ground reflection, tinted by this nail's own photo-lighting estimate. */
function sampleEnvironment(normalY: number, photoTint: [number, number, number], photoAmbient: number): [number, number, number] {
  const band = clamp(-normalY * 0.6 + 0.5)
  const sky: [number, number, number] = [0.86, 0.91, 0.98]
  const mid: [number, number, number] = [0.55, 0.55, 0.58]
  const ground: [number, number, number] = [0.22, 0.19, 0.17]
  const c = band > 0.5 ? mix3(mid, sky, (band - 0.5) * 2) : mix3(ground, mid, band * 2)
  return [clamp(c[0] * photoTint[0] * photoAmbient), clamp(c[1] * photoTint[1] * photoAmbient), clamp(c[2] * photoTint[2] * photoAmbient)]
}

/** Deterministic, spatially-smooth (not salt-and-pepper) micro-normal perturbation. Glitter gets sparse bright flakes instead. */
function microNormalOffset(xx: number, yy: number, seed: number, strength: number, isGlitter: boolean): [number, number] {
  if (strength <= 0) return [0, 0]
  if (isGlitter) {
    const flake = hash(xx, yy, seed * 13 + 1)
    if (flake > 0.965) {
      const a = hash(xx, yy, seed * 29 + 2) * Math.PI * 2
      return [Math.cos(a) * strength * 3.2, Math.sin(a) * strength * 3.2]
    }
    return [0, 0]
  }
  // Low frequency (roughly one soft undulation across the whole nail) so this reads as
  // gentle organic surface waviness rather than a repeating hatch/moiré pattern — a
  // sharp clear-coat specular exponent amplifies even small normal perturbations, so
  // anything higher-frequency than this becomes visible fabric-like texture.
  const nx = Math.sin(xx * 0.045 + seed * 3.1) + Math.sin(yy * 0.021 - seed * 1.3) * 0.5
  const ny = Math.cos(yy * 0.038 + seed * 2.3) + Math.cos(xx * 0.017 - seed * 0.9) * 0.5
  return [nx * strength * 0.5, ny * strength * 0.5]
}

// ---------------------------------------------------------------------------
// Main compositor
// ---------------------------------------------------------------------------

/**
 * Composites one nail's pigment, decals and clear-coat/reflection into a
 * single bbox-sized canvas, per pixel:
 *
 *   pigment (paint gradient, lit by macro+micro normal + real photo luminance)
 *     -> embedded/flat decals, curvature-warped, lit by the same local exposure, tinted if tintable
 *     -> clear-coat specular + Fresnel + environment reflection over the combined buffer,
 *        plus restrained cuticle/edge contact shading
 *     -> raised charms (pearls, domed gems, padded bows): independent dome shading +
 *        contact shadow, composited ON TOP of the clear coat, never curvature-warped
 *
 * All per-pixel randomness is a deterministic hash of (pixel, seed) — never
 * time-based — so re-rendering the same design produces an identical result.
 */
export function composeNail(
  g: PreparedNail,
  paint: PaintConfig,
  material: MaterialConfig,
  decals: DecalLayer[],
  light: LightState = DEFAULT_LIGHT,
  seed = 0,
): HTMLCanvasElement {
  const profile = resolveMaterialProfile(material)
  const isGlitter = profile.glitterDensity > 0.05

  const az = (light.angle * Math.PI) / 180
  const el = (light.elevation * Math.PI) / 180
  const L = norm3([Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)])
  const H = norm3([L[0], L[1], L[2] + 1])

  const solidColor = paint.mode === 'solid' ? hexToRgb01(paint.stops[0]?.color ?? '#cccccc') : null
  const sample = solidColor ? null : stopSampler(paint.stops)
  const [a0, a1] = paint.start
  const [b0, b1] = paint.end

  const n = g.w * g.h
  const work = new Float32Array(n * 3)
  const finalNormal = new Float32Array(n * 3)
  const workAlpha = g.alpha // reused as-is; decals don't extend the mask

  // Pass A — pigment + macro/micro-normal diffuse shading.
  for (let k = 0; k < n; k++) {
    if (!g.alpha[k]) continue
    const xx = k % g.w
    const yy = (k - xx) / g.w
    const u = g.uv[k * 2]
    const v = g.uv[k * 2 + 1]
    const macroNx = g.normal[k * 3]
    const macroNy = g.normal[k * 3 + 1]
    const macroNz = g.normal[k * 3 + 2]

    const [mnx, mny] = microNormalOffset(xx, yy, seed + 1, profile.microNormalStrength, isGlitter)
    const fn = norm3([macroNx + mnx, macroNy + mny, macroNz])
    finalNormal[k * 3] = fn[0]
    finalNormal[k * 3 + 1] = fn[1]
    finalNormal[k * 3 + 2] = fn[2]

    let t = 0
    if (paint.mode === 'linear') {
      t = ((u - a0) * (b0 - a0) + (v - a1) * (b1 - a1)) / ((b0 - a0) ** 2 + (b1 - a1) ** 2 || 1)
    } else if (paint.mode === 'radial') {
      t = Math.hypot(u - a0, v - a1) / (Math.hypot(b0 - a0, b1 - a1) || 0.5)
    } else if (paint.mode === 'aurora') {
      t = 0.5 + 0.28 * Math.sin(u * 5 + v * 4) + 0.22 * Math.cos(v * 7 - u * 2)
    }
    let color: [number, number, number] = solidColor ?? sample!(clamp(t))

    if (profile.catEyeStrength > 0) {
      const ca = (profile.catEyeAngleDeg * Math.PI) / 180
      const d = (u - 0.5) * Math.cos(ca) + (v - 0.5) * Math.sin(ca)
      const band = Math.exp(-(((d + 0.07 * Math.sin(v * 4)) / 0.06) ** 2))
      // A narrow, near-white magnetic-particle streak that reads clearly regardless of
      // the underlying gradient — real cat-eye gel shows a bright slit, not a soft tint.
      color = mix3(color, [0.97, 0.96, 1], Math.min(1, band * 1.15) * profile.catEyeStrength)
    }
    if (profile.iridescence > 0) {
      const phase = u * 2.4 + v * 1.6 + fn[0] * 0.8
      const hue = phase - Math.floor(phase)
      const rainbow = hsv2rgb(hue, 0.65, 1)
      color = mix3(color, rainbow, profile.iridescence * 0.35)
    }

    const diffuse = Math.max(0, fn[0] * L[0] + fn[1] * L[1] + fn[2] * L[2])
    const shade = g.light[k] * g.photoAmbient * (light.ambient + light.strength * (diffuse - 0.75) * 0.5)
    color = [clamp(color[0] * shade), clamp(color[1] * shade), clamp(color[2] * shade)]

    if (isGlitter) {
      const flake = hash(xx, yy, seed * 13 + 1)
      if (flake > 0.965) {
        const sparkle = clamp(diffuse * 1.4) * profile.glitterDensity
        color = mix3(color, [1, 1, 1], sparkle * 0.8)
      }
    }

    // Real sheer/jelly polish reads sheerest right at the cuticle and builds toward the
    // free edge (one light coat near the base, coverage catching up by the tip) rather than
    // a uniform flat tint — a translucent material keeps that same v-gradient here so the
    // natural nail plate stays visible near the cuticle instead of looking like a uniform
    // "opaque colour rectangle" dropped on top of the photo.
    const tipDensity = profile.translucency > 0.01 ? 0.78 + 0.22 * smoothstep01(0.15, 0.75, v) : 1
    const opacity = clamp(paint.opacity * (1 - profile.translucency) * tipDensity)
    const srcColor: [number, number, number] = [g.source[k * 4] / 255, g.source[k * 4 + 1] / 255, g.source[k * 4 + 2] / 255]
    color = mix3(srcColor, color, opacity)

    work[k * 3] = color[0]
    work[k * 3 + 1] = color[1]
    work[k * 3 + 2] = color[2]
  }

  // Pass B — embedded/flat decals (foil too; raised charms are Pass D below). The goal is
  // a decal that reads as *printed on the same lit surface* as the pigment, not an RGBA
  // sprite dropped on top: local exposure follows the nail's own light map + diffuse
  // response (same signal Pass A uses, so a decal on a shadowed side-wall genuinely dims
  // with the surface it's embedded in), hue is preserved by scaling all channels by one
  // exposure term rather than tinting toward a fixed shade, local contrast is softened at
  // strong curvature (the shading swing at grazing macro-normal angles otherwise reads as
  // harsh banding across a decal instead of gentle wrap), and the box edge is feathered so
  // decals whose artwork nearly fills their footprint don't show a hard rectangular cutoff.
  for (const decal of decals) {
    if (decal.layerType === 'raised') continue
    const rad = (-decal.rotationDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const [cbx, cby, cbw, cbh] = decal.contentBounds
    const halfDiag = Math.hypot(decal.widthPx, decal.heightPx) / 2 + 2
    const minX = Math.max(0, Math.floor(decal.centerX - g.x - halfDiag))
    const maxX = Math.min(g.w, Math.ceil(decal.centerX - g.x + halfDiag))
    const minY = Math.max(0, Math.floor(decal.centerY - g.y - halfDiag))
    const maxY = Math.min(g.h, Math.ceil(decal.centerY - g.y + halfDiag))

    for (let yy = minY; yy < maxY; yy++) {
      for (let xx = minX; xx < maxX; xx++) {
        const k = yy * g.w + xx
        if (!g.alpha[k]) continue
        const ix = g.x + xx
        const iy = g.y + yy
        const rx = ix - decal.centerX
        const ry = iy - decal.centerY
        const lx = rx * cos - ry * sin
        const ly = rx * sin + ry * cos
        let nx = lx / decal.widthPx
        const ny = ly / decal.heightPx
        nx += g.curve[k] * decal.curvature * 0.5
        if (decal.flipX) nx = -nx
        if (nx < -0.5 || nx > 0.5 || ny < -0.5 || ny > 0.5) continue

        const srcX = (cbx + (nx + 0.5) * cbw) * decal.pixels.width
        const srcY = (cby + (ny + 0.5) * cbh) * decal.pixels.height
        const [r, gg, b, a] = sampleBilinear(decal.pixels, srcX, srcY)
        // Feather the last ~8% of the placement box instead of a hard box cutoff, so
        // artwork drawn close to its own bounds (e.g. a lace hem) doesn't show a seam.
        const edgeFalloff = 1 - smoothstep01(0.42, 0.5, Math.max(Math.abs(nx), Math.abs(ny)))
        let alpha01 = (a / 255) * decal.opacity * edgeFalloff
        if (alpha01 <= 0.001) continue

        let dr = r / 255
        let dg = gg / 255
        let db = b / 255
        if (decal.tint) {
          const lum = dr * 0.2126 + dg * 0.7152 + db * 0.0722
          dr = decal.tint[0] * lum
          dg = decal.tint[1] * lum
          db = decal.tint[2] * lum
        }

        const diffuse = Math.max(0, finalNormal[k * 3] * L[0] + finalNormal[k * 3 + 1] * L[1] + finalNormal[k * 3 + 2] * L[2])
        // Dampened (60%) and curvature-softened diffuse swing relative to the pigment's own —
        // ink/pigment sitting *in* the polish doesn't lose as much apparent colour under raking
        // light as a glassy clear-coat area does, and a strong-curvature edge (where the macro
        // normal turns sharply) shouldn't read as a hard dark/light band across one decal.
        const curveMag = Math.min(1, Math.abs(g.curve[k]) * 2)
        const diffuseTerm = light.strength * (diffuse - 0.75) * 0.5 * 0.6 * (1 - curveMag * 0.5)
        const localExposure = clamp(g.light[k] * g.photoAmbient * (light.ambient + diffuseTerm), 0.62, 1.18)
        dr = clamp(dr * localExposure)
        dg = clamp(dg * localExposure)
        db = clamp(db * localExposure)

        // Mild pigment-absorption: a decal catching more of the surface's own light reads as
        // slightly more opaque/on-top; one sitting in a dimmer pocket blends a touch further
        // into the base coat beneath it, instead of every pixel using the sticker's raw alpha.
        alpha01 = clamp(alpha01 * (0.88 + localExposure * 0.12), 0, 1)

        work[k * 3] = work[k * 3] * (1 - alpha01) + dr * alpha01
        work[k * 3 + 1] = work[k * 3 + 1] * (1 - alpha01) + dg * alpha01
        work[k * 3 + 2] = work[k * 3 + 2] * (1 - alpha01) + db * alpha01
      }
    }
  }

  // Pass C — clear coat, Fresnel, environment reflection, edge integration. Runs over
  // the combined pigment+decal buffer so gloss glides over decals, not just pigment.
  // The specular lobe width comes from the material's own roughness (+ a small
  // deterministic per-pixel variation, e.g. matte's slightly uneven finish); the
  // clear-coat's roughness separately controls how tinted-vs-white the glint reads.
  for (let k = 0; k < n; k++) {
    if (!g.alpha[k]) continue
    const xx = k % g.w
    const yy = (k - xx) / g.w
    const fnx = finalNormal[k * 3]
    const fny = finalNormal[k * 3 + 1]
    const fnz = finalNormal[k * 3 + 2]
    const ndotv = clamp(fnz) // view vector approximated as [0,0,1] for this static 2.5D camera
    const F = fresnelSchlick(profile.fresnelF0, ndotv)

    const roughVariation = (hash(xx, yy, seed * 7 + 3) - 0.5) * 2 * profile.roughnessVariation
    const pixelRoughness = clamp(profile.roughness + roughVariation, 0.03, 0.97)
    const clearcoatExponent = 4 + (1 - pixelRoughness) * 140

    const specN = Math.max(0, fnx * H[0] + fny * H[1] + fnz * H[2])
    const clearcoatSpec = Math.pow(specN, clearcoatExponent) * profile.clearcoat * F

    const env = sampleEnvironment(fny, g.photoTint, g.photoAmbient)
    const envReflect = profile.environmentReflection * F

    let color: [number, number, number] = [work[k * 3], work[k * 3 + 1], work[k * 3 + 2]]

    if (profile.metallic > 0) {
      // Metallic finishes (chrome): the environment color multiplies into the pigment
      // rather than just adding a highlight on top, giving a liquid-metal look instead
      // of a tinted-white streak.
      color = mix3(color, [color[0] * env[0] * 1.6, color[1] * env[1] * 1.6, color[2] * env[2] * 1.6], profile.metallic * envReflect)
    } else if (envReflect > 0.01) {
      color = [clamp(color[0] + env[0] * envReflect * 0.4), clamp(color[1] + env[1] * envReflect * 0.4), clamp(color[2] + env[2] * envReflect * 0.4)]
    }

    // Clear-coat glint: crisp/white for glossy finishes, broader and tinted toward the
    // pigment (not pure white) for matte, per material.clearcoatRoughness/translucency.
    const glintWhiteMix = clamp(1 - profile.clearcoatRoughness * 0.7)
    const glintColor = mix3(color, [1, 1, 1], glintWhiteMix)
    color = [clamp(color[0] + glintColor[0] * clearcoatSpec), clamp(color[1] + glintColor[1] * clearcoatSpec), clamp(color[2] + glintColor[2] * clearcoatSpec)]

    // Restrained cuticle/contact shading — a couple of source pixels at the mask
    // boundary, not a visible outline.
    const edgeShade = 0.88 + 0.12 * g.edge[k]
    color = [color[0] * edgeShade, color[1] * edgeShade, color[2] * edgeShade]

    work[k * 3] = color[0]
    work[k * 3 + 1] = color[1]
    work[k * 3 + 2] = color[2]
  }

  // Pass D — raised charms (pearls, domed gems, padded bows): independent dome-shaded
  // objects sitting ON TOP of the finished clear coat, not embedded in it — they do NOT
  // receive Pass C's clearcoat/Fresnel/environment treatment (a solid charm physically
  // blocks whatever gloss was underneath it, exactly like a real applied embellishment).
  // The dome normal is an analytic ellipsoid fit to the decal's own placement box, masked
  // by that decal's true alpha silhouette (so a bow's two loops+knot are lit as one
  // coherent puffy shape, not a plain circle) — not curvature-warped, since a rigid charm
  // keeps its own form regardless of the nail's curvature underneath it.
  for (const decal of decals) {
    if (decal.layerType !== 'raised') continue
    const rad = (-decal.rotationDeg * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    const [cbx, cby, cbw, cbh] = decal.contentBounds
    const halfDiag = Math.hypot(decal.widthPx, decal.heightPx) / 2 + 4
    const minX = Math.max(0, Math.floor(decal.centerX - g.x - halfDiag))
    const maxX = Math.min(g.w, Math.ceil(decal.centerX - g.x + halfDiag))
    const minY = Math.max(0, Math.floor(decal.centerY - g.y - halfDiag))
    const maxY = Math.min(g.h, Math.ceil(decal.centerY - g.y + halfDiag))

    // Feathered (not hard-cutoff) box edge — a decal like the padded bow, whose loops
    // reach close to its own placement-box edge, would otherwise show a visible straight
    // clip line exactly where the box boundary crosses still-opaque artwork.
    const sampleShapeAlpha = (nx: number, ny: number): number => {
      if (nx < -0.5 || nx > 0.5 || ny < -0.5 || ny > 0.5) return 0
      const srcX = (cbx + (nx + 0.5) * cbw) * decal.pixels.width
      const srcY = (cby + (ny + 0.5) * cbh) * decal.pixels.height
      const raw = sampleBilinear(decal.pixels, srcX, srcY)[3] / 255
      const edgeFalloff = 1 - smoothstep01(0.42, 0.5, Math.max(Math.abs(nx), Math.abs(ny)))
      return raw * edgeFalloff
    }

    for (let yy = minY; yy < maxY; yy++) {
      for (let xx = minX; xx < maxX; xx++) {
        const k = yy * g.w + xx
        if (!g.alpha[k]) continue
        const ix = g.x + xx
        const iy = g.y + yy
        const rx = ix - decal.centerX
        const ry = iy - decal.centerY
        const lx = rx * cos - ry * sin
        const ly = rx * sin + ry * cos
        let nx = lx / decal.widthPx
        const ny = ly / decal.heightPx
        if (decal.flipX) nx = -nx
        if (nx < -0.5 || nx > 0.5 || ny < -0.5 || ny > 0.5) continue

        const shapeAlpha = sampleShapeAlpha(nx, ny)

        // Soft isotropic contact shadow in the ring just outside the true silhouette —
        // sampling the same shape function at a shrunk coordinate tests membership in a
        // ~14%-dilated copy of it, so the ring falls exactly around the real shape.
        const dilatedAlpha = sampleShapeAlpha(nx / 1.14, ny / 1.14)
        const shadowRing = clamp(dilatedAlpha - shapeAlpha) * 0.4
        if (shadowRing > 0.001) {
          work[k * 3] *= 1 - shadowRing
          work[k * 3 + 1] *= 1 - shadowRing
          work[k * 3 + 2] *= 1 - shadowRing
        }

        const alpha01 = shapeAlpha * decal.opacity
        if (alpha01 <= 0.001) continue

        const srcX = (cbx + (nx + 0.5) * cbw) * decal.pixels.width
        const srcY = (cby + (ny + 0.5) * cbh) * decal.pixels.height
        const [r, gg, b] = sampleBilinear(decal.pixels, srcX, srcY)
        let dr = r / 255
        let dg = gg / 255
        let db = b / 255
        if (decal.tint) {
          const lum = dr * 0.2126 + dg * 0.7152 + db * 0.0722
          dr = decal.tint[0] * lum
          dg = decal.tint[1] * lum
          db = decal.tint[2] * lum
        }

        const dnx = clamp(nx * 2, -1, 1)
        const dny = clamp(ny * 2, -1, 1)
        const dnz = Math.sqrt(Math.max(0.06, 1 - dnx * dnx - dny * dny))
        const domeN = norm3([dnx, dny, dnz])
        const diffuse = Math.max(0, domeN[0] * L[0] + domeN[1] * L[1] + domeN[2] * L[2])
        const spec = Math.pow(Math.max(0, domeN[0] * H[0] + domeN[1] * H[1] + domeN[2] * H[2]), 46)

        // A touch of the nail's own photo-derived ambient tint, so the same charm reads
        // consistently warm/cool with the rest of this hand photo's lighting — dampened to
        // ~22% strength; the raw photoTint ratio is tuned for pigment mixing in Pass A and
        // is far too strong applied directly to a near-white pearl (it reads as orange).
        const tintAmount = 0.22
        const ambientTint: [number, number, number] = [
          1 + (g.photoTint[0] - 1) * tintAmount,
          1 + (g.photoTint[1] - 1) * tintAmount,
          1 + (g.photoTint[2] - 1) * tintAmount,
        ]
        // Blend the dome-shaded result with the artwork's own flat colour (30%) rather than
        // fully replacing it — a single ellipsoid normal spans the whole placement box, so a
        // multi-lobe shape (a bow's two loops + knot) needs some of its own painted shading
        // (the darker gap between overlapping loops) to survive, or the dome sweep flattens
        // the silhouette into one smooth blob with no visible lobes.
        const domeShade = 0.5 + 0.5 * diffuse
        let lit: [number, number, number] = [
          dr * (domeShade * 0.7 + 0.3),
          dg * (domeShade * 0.7 + 0.3),
          db * (domeShade * 0.7 + 0.3),
        ]
        lit = [clamp(lit[0] * ambientTint[0]), clamp(lit[1] * ambientTint[1]), clamp(lit[2] * ambientTint[2])]
        lit = [clamp(lit[0] + spec * 0.65), clamp(lit[1] + spec * 0.65), clamp(lit[2] + spec * 0.65)]

        work[k * 3] = work[k * 3] * (1 - alpha01) + lit[0] * alpha01
        work[k * 3 + 1] = work[k * 3 + 1] * (1 - alpha01) + lit[1] * alpha01
        work[k * 3 + 2] = work[k * 3 + 2] * (1 - alpha01) + lit[2] * alpha01
      }
    }
  }

  const canvas = document.createElement('canvas')
  canvas.width = g.w
  canvas.height = g.h
  const ctx = canvas.getContext('2d')!
  const im = ctx.createImageData(g.w, g.h)
  const out = im.data
  for (let k = 0; k < n; k++) {
    const off = k * 4
    out[off] = clamp(work[k * 3]) * 255
    out[off + 1] = clamp(work[k * 3 + 1]) * 255
    out[off + 2] = clamp(work[k * 3 + 2]) * 255
    out[off + 3] = workAlpha[k]
  }
  ctx.putImageData(im, 0, 0)
  return canvas
}

// ---------------------------------------------------------------------------
// Debug visualization modes — objective, inspectable proof that the macro/micro
// normal, per-pixel roughness and Fresnel term computed above actually
// participate in the render, not just the final lit composite. Diagnostic
// only; never shown outside the debug overlay (Phase 5).
// ---------------------------------------------------------------------------

export type DebugViewMode = 'normal' | 'roughness' | 'fresnel' | 'curve' | 'edge'

export function renderDebugView(g: PreparedNail, material: MaterialConfig, mode: DebugViewMode, seed = 0): HTMLCanvasElement {
  const profile = resolveMaterialProfile(material)
  const isGlitter = profile.glitterDensity > 0.05
  const n = g.w * g.h
  const canvas = document.createElement('canvas')
  canvas.width = g.w
  canvas.height = g.h
  const ctx = canvas.getContext('2d')!
  const im = ctx.createImageData(g.w, g.h)
  const out = im.data

  for (let k = 0; k < n; k++) {
    const off = k * 4
    if (!g.alpha[k]) continue
    const xx = k % g.w
    const yy = (k - xx) / g.w

    if (mode === 'normal') {
      const [mnx, mny] = microNormalOffset(xx, yy, seed + 1, profile.microNormalStrength, isGlitter)
      const fn = norm3([g.normal[k * 3] + mnx, g.normal[k * 3 + 1] + mny, g.normal[k * 3 + 2]])
      // Standard tangent-space normal-map encoding: xyz in [-1,1] -> rgb in [0,255].
      out[off] = clamp(fn[0] * 0.5 + 0.5) * 255
      out[off + 1] = clamp(fn[1] * 0.5 + 0.5) * 255
      out[off + 2] = clamp(fn[2] * 0.5 + 0.5) * 255
    } else if (mode === 'roughness') {
      const roughVariation = (hash(xx, yy, seed * 7 + 3) - 0.5) * 2 * profile.roughnessVariation
      const pixelRoughness = clamp(profile.roughness + roughVariation, 0.03, 0.97)
      // Grayscale: black = mirror-smooth, white = fully diffuse/rough.
      const v = pixelRoughness * 255
      out[off] = v
      out[off + 1] = v
      out[off + 2] = v
    } else if (mode === 'fresnel') {
      const ndotv = clamp(g.normal[k * 3 + 2])
      const F = fresnelSchlick(profile.fresnelF0, ndotv)
      // Grayscale: black = low reflectance at this view angle, white = near-total (grazing) reflectance.
      const v = clamp(F) * 255
      out[off] = v
      out[off + 1] = v
      out[off + 2] = v
    } else if (mode === 'curve') {
      // Signed curvature field, remapped from [-1,1] to [0,255] around mid-gray.
      const v = clamp(g.curve[k] * 0.5 + 0.5) * 255
      out[off] = v
      out[off + 1] = v
      out[off + 2] = v
    } else if (mode === 'edge') {
      const v = clamp(g.edge[k]) * 255
      out[off] = v
      out[off + 1] = v
      out[off + 2] = v
    }
    out[off + 3] = g.alpha[k]
  }
  ctx.putImageData(im, 0, 0)
  return canvas
}

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const k = (n: number) => (n + h * 6) % 6
  const f = (n: number) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1))
  return [f(5), f(3), f(1)]
}

// Raised charms (pearls, domed gems, padded bows) are rendered end-to-end inside
// composeNail's Pass D, from the decal's own alpha silhouette — see the comment there.
// (A prior standalone renderRaisedCharm() existed here but was never wired into the
// compositor; Pass D supersedes it and reads any real decal shape, not just a circle.)
