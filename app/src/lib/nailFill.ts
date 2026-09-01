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

function hexToRgb01(hex: string): [number, number, number] {
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
 *     -> decals, curvature-warped, lit by the same shading, tinted if tintable
 *     -> clear-coat specular + Fresnel + environment reflection over the combined buffer
 *     -> restrained cuticle/edge contact shading
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

    const opacity = paint.opacity * (1 - profile.translucency)
    const srcColor: [number, number, number] = [g.source[k * 4] / 255, g.source[k * 4 + 1] / 255, g.source[k * 4 + 2] / 255]
    color = mix3(srcColor, color, opacity)

    work[k * 3] = color[0]
    work[k * 3 + 1] = color[1]
    work[k * 3 + 2] = color[2]
  }

  // Pass B — decals (flat/foil only; raised charms render through renderRaisedCharm instead).
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
        const alpha01 = (a / 255) * decal.opacity
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
        const shade = g.light[k] * g.photoAmbient * (light.ambient + light.strength * (diffuse - 0.75) * 0.5)
        dr = clamp(dr * shade)
        dg = clamp(dg * shade)
        db = clamp(db * shade)

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

function hsv2rgb(h: number, s: number, v: number): [number, number, number] {
  const k = (n: number) => (n + h * 6) % 6
  const f = (n: number) => v - v * s * Math.max(0, Math.min(k(n), 4 - k(n), 1))
  return [f(5), f(3), f(1)]
}

// ---------------------------------------------------------------------------
// Raised charm / rhinestone layer — architecturally separate from flat decals.
// A small synthetic dome normal + its own specular + a soft baked-in contact
// shadow, rather than the flat-decal shading formula above.
// ---------------------------------------------------------------------------

export function renderRaisedCharm(sizePx: number, baseColor: string, light: LightState = DEFAULT_LIGHT): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  const pad = Math.ceil(sizePx * 0.18)
  const dim = Math.ceil(sizePx + pad * 2)
  canvas.width = dim
  canvas.height = dim
  const ctx = canvas.getContext('2d')!
  const im = ctx.createImageData(dim, dim)
  const out = im.data
  const base = hexToRgb01(baseColor)
  const r = sizePx / 2
  const cx = dim / 2
  const cy = dim / 2 + pad * 0.15

  const az = (light.angle * Math.PI) / 180
  const el = (light.elevation * Math.PI) / 180
  const L = norm3([Math.cos(az) * Math.cos(el), Math.sin(az) * Math.cos(el), Math.sin(el)])
  const H = norm3([L[0], L[1], L[2] + 1])

  for (let yy = 0; yy < dim; yy++) {
    for (let xx = 0; xx < dim; xx++) {
      const dx = (xx - cx) / r
      const dy = (yy - cy) / r
      const d2 = dx * dx + dy * dy
      const off = (yy * dim + xx) * 4
      if (d2 > 1.08) continue
      if (d2 > 1) {
        // soft contact shadow just outside the dome footprint
        const shadowT = clamp((1.08 - d2) / 0.08)
        out[off + 3] = shadowT * 70
        continue
      }
      const nz = Math.sqrt(Math.max(0, 1 - d2))
      const n = norm3([dx, dy, nz])
      const diffuse = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2])
      const spec = Math.pow(Math.max(0, n[0] * H[0] + n[1] * H[1] + n[2] * H[2]), 40)
      let color = mix3(base, [base[0] * 0.5, base[1] * 0.5, base[2] * 0.55], 1 - diffuse)
      color = [clamp(color[0] + spec), clamp(color[1] + spec), clamp(color[2] + spec)]
      out[off] = color[0] * 255
      out[off + 1] = color[1] * 255
      out[off + 2] = color[2] * 255
      out[off + 3] = 255
    }
  }
  ctx.putImageData(im, 0, 0)
  return canvas
}
