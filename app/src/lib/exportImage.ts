import { getHandData, handBaseUrl, resolveDecalPath } from '@/data/loaders'
import { getResolvedDecalAsset } from '@/lib/decalCache'
import { LENGTH_SCALE, lengthScaleMatrixValues, localToImage, nailWidthPx, shapeTrimUv } from '@/lib/geometry'
import { buildMaterialConfig, buildPaintConfig, composeNail, DEFAULT_LIGHT, hexToRgb01, type DecalLayer, type LightState } from '@/lib/nailFill'
import { maskGrowPxFor } from '@/lib/nailEdgeTuning'
import { getPreparedHand } from '@/lib/nailLighting'
import { FINGER_ORDER, type ColorPreset, type DecalAsset, type FingerDesign, type FingerId, type NailCoord, type SkinToneId } from '@/types/vibeu'

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load ${src}`))
    img.src = src
  })
}

async function buildDecalLayersForExport(
  nail: NailCoord,
  design: FingerDesign,
  stickersById: Record<string, DecalAsset>,
): Promise<DecalLayer[]> {
  const layers: DecalLayer[] = []
  const sorted = [...design.stickers].sort((a, b) => a.z - b.z)
  for (const st of sorted) {
    if (st.visible === false) continue
    const asset = stickersById[st.stickerId]
    if (!asset) continue
    const resolved = await getResolvedDecalAsset(resolveDecalPath(asset.path))
    const [cx, cy] = localToImage(nail, st.uv)
    const widthPx = nailWidthPx(nail) * asset.defaultScale * st.scale
    const [, , cbw, cbh] = resolved.contentBounds
    const contentAspect = (cbh * resolved.pixels.height) / (cbw * resolved.pixels.width || 1)
    layers.push({
      pixels: resolved.pixels,
      contentBounds: resolved.contentBounds,
      centerX: cx,
      centerY: cy,
      widthPx,
      heightPx: widthPx * contentAspect,
      rotationDeg: st.rotation,
      flipX: st.flipX ?? false,
      opacity: st.opacity ?? 1,
      tint: asset.tintable && st.tint ? hexToRgb01(st.tint) : null,
      curvature: 0.55,
      layerType: asset.layerType === 'raised' ? 'raised' : asset.layerType,
    })
  }
  return layers
}

/**
 * Renders the exact current design — same compositor as the live studio — onto one
 * master canvas at the source hand photo's full resolution, with no gizmo handles,
 * selection outlines, or debug overlay (those only ever exist in the interactive SVG
 * layer, never in this canvas), then returns it as a downloadable PNG blob.
 */
export async function exportDesignPng(
  skinTone: SkinToneId,
  fingers: Record<FingerId, FingerDesign>,
  presetsById: Record<string, ColorPreset>,
  stickersById: Record<string, DecalAsset>,
  light: LightState = DEFAULT_LIGHT,
): Promise<Blob> {
  const [hand, preparedMap, baseImg] = await Promise.all([getHandData(skinTone), getPreparedHand(skinTone), loadImage(handBaseUrl(skinTone))])

  const canvas = document.createElement('canvas')
  canvas.width = hand.width
  canvas.height = hand.height
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(baseImg, 0, 0, hand.width, hand.height)

  for (const nail of hand.nails) {
    const design = fingers[nail.id]
    const preset = presetsById[design.presetId]
    const prepared = preparedMap.get(nail.id)
    if (!preset || !prepared) continue

    const paintCfg = buildPaintConfig(preset, design.customColor, design.customGradient)
    const materialCfg = buildMaterialConfig(preset, design.effect)
    const decalLayers = await buildDecalLayersForExport(nail, design, stickersById)
    const seed = FINGER_ORDER.indexOf(nail.id)
    const nailCanvas = composeNail(prepared, paintCfg, materialCfg, decalLayers, light, seed)

    // Composite this nail's content on a full-size scratch layer first, then mask it with
    // a RASTER clip (fill + stroke-dilated outline, unioned by alpha) before compositing
    // onto the real canvas. A stroke-based dilation grows the silhouette outward by a true
    // isotropic pixel distance along the path's own local normal, unlike a centroid-scaled
    // matrix transform (which over/under-grows anisotropically on a rotated or elongated
    // nail — confirmed visually on the thumb, which sits at a real angle in the photo).
    // growPx must match nailLighting.ts's buffer padding (nailEdgeTuning.ts is the single
    // source of truth) — otherwise the exported PNG would clip away pixels the live
    // preview shows.
    const growPx = maskGrowPxFor(skinTone, nail.id)
    const layer = document.createElement('canvas')
    layer.width = canvas.width
    layer.height = canvas.height
    const layerCtx = layer.getContext('2d')!
    layerCtx.save()
    const trimUv = shapeTrimUv(design.shape)
    if (trimUv) {
      const trimPath = new Path2D()
      trimUv.forEach((uv, i) => {
        const [x, y] = localToImage(nail, uv)
        if (i === 0) trimPath.moveTo(x, y)
        else trimPath.lineTo(x, y)
      })
      trimPath.closePath()
      layerCtx.clip(trimPath)
    }
    const m = lengthScaleMatrixValues(nail, LENGTH_SCALE[design.length])
    layerCtx.transform(m.a, m.b, m.c, m.d, m.e, m.f)
    layerCtx.drawImage(nailCanvas, prepared.x, prepared.y)
    layerCtx.restore()

    const mask = document.createElement('canvas')
    mask.width = canvas.width
    mask.height = canvas.height
    const maskCtx = mask.getContext('2d')!
    const maskPath = new Path2D(nail.path)
    maskCtx.fill(maskPath)
    if (growPx > 0) {
      maskCtx.lineWidth = growPx * 2
      maskCtx.lineJoin = 'round'
      maskCtx.stroke(maskPath)
    }
    layerCtx.globalCompositeOperation = 'destination-in'
    layerCtx.drawImage(mask, 0, 0)

    ctx.drawImage(layer, 0, 0)
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
