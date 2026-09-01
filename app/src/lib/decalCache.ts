import type { DecalPixels } from '@/lib/nailFill'
import type { DecalAsset } from '@/types/vibeu'

const cache = new Map<string, Promise<DecalPixels>>()
const MAX_UPLOAD_DIM = 800 // downscale huge uploads so a giant photo can't freeze the compositor

/** Decode an image URL to raw RGBA pixels once, cached by URL for the life of the page. */
export function getDecalPixels(url: string): Promise<DecalPixels> {
  let cached = cache.get(url)
  if (!cached) {
    cached = new Promise<DecalPixels>((resolve, reject) => {
      const img = new Image()
      img.decoding = 'sync'
      img.onload = () => {
        const scale = Math.min(1, MAX_UPLOAD_DIM / Math.max(img.naturalWidth, img.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale))
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height)
        resolve({ data, width, height })
      }
      img.onerror = () => reject(new Error(`Failed to decode decal image ${url}`))
      img.src = url
    })
    cache.set(url, cached)
  }
  return cached
}

/** Scan the alpha channel for the smallest bounding box containing visible content, normalized 0..1. */
export function computeContentBounds(pixels: DecalPixels): [number, number, number, number] {
  let minX = pixels.width
  let minY = pixels.height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < pixels.height; y++) {
    for (let x = 0; x < pixels.width; x++) {
      const a = pixels.data[(y * pixels.width + x) * 4 + 3]
      if (a < 8) continue
      if (x < minX) minX = x
      if (x > maxX) maxX = x
      if (y < minY) minY = y
      if (y > maxY) maxY = y
    }
  }
  if (maxX < minX || maxY < minY) return [0, 0, 1, 1]
  const w = pixels.width
  const h = pixels.height
  return [minX / w, minY / h, (maxX - minX + 1) / w, (maxY - minY + 1) / h]
}

export interface ResolvedDecalAsset {
  pixels: DecalPixels
  contentBounds: [number, number, number, number]
}

const resolvedCache = new Map<string, Promise<ResolvedDecalAsset>>()

/** Decoded pixels + auto-detected content bounds for one decal image URL, cached. */
export function getResolvedDecalAsset(url: string): Promise<ResolvedDecalAsset> {
  let cached = resolvedCache.get(url)
  if (!cached) {
    cached = getDecalPixels(url).then((pixels) => ({ pixels, contentBounds: computeContentBounds(pixels) }))
    resolvedCache.set(url, cached)
  }
  return cached
}

const ACCEPTED_UPLOAD_TYPES = ['image/png', 'image/webp', 'image/jpeg', 'image/svg+xml']
const MAX_UPLOAD_BYTES = 6 * 1024 * 1024 // 6MB

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Registers a user-uploaded PNG/WebP/JPEG/SVG as a runtime DecalAsset: reads it as a data
 * URL (so it round-trips through save/load without a backend), decodes it once to
 * auto-detect its real content bounds (so transparent padding doesn't throw off
 * centering/scaling), and caches the decoded pixels for the compositor.
 */
export async function registerUploadedDecal(file: File): Promise<DecalAsset> {
  if (!ACCEPTED_UPLOAD_TYPES.includes(file.type)) {
    throw new Error('Định dạng không được hỗ trợ. Hãy dùng PNG, WebP, JPEG hoặc SVG.')
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('File quá lớn (tối đa 6MB).')
  }
  const dataUrl = await readFileAsDataUrl(file)
  const resolved = await getResolvedDecalAsset(dataUrl)
  const id = `custom-${Date.now()}-${Math.round(Math.random() * 1e6)}`
  const baseName = file.name.replace(/\.[^.]+$/, '') || 'Decal tùy chỉnh'
  return {
    id,
    name: baseName,
    nameVi: baseName,
    category: 'custom',
    categoryVi: 'Tải lên',
    tags: ['custom', 'upload'],
    path: dataUrl,
    viewBox: [resolved.pixels.width, resolved.pixels.height],
    contentBounds: resolved.contentBounds,
    defaultScale: 0.6,
    tintable: false,
    layerType: 'decal',
    source: `Uploaded by user (${file.name})`,
    license: 'User-provided — not redistributed, stored locally in this browser only',
  }
}
