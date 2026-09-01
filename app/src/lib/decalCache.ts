import type { DecalPixels } from '@/lib/nailFill'

const cache = new Map<string, Promise<DecalPixels>>()

/** Decode an image URL to raw RGBA pixels once, cached by URL for the life of the page. */
export function getDecalPixels(url: string): Promise<DecalPixels> {
  let cached = cache.get(url)
  if (!cached) {
    cached = new Promise<DecalPixels>((resolve, reject) => {
      const img = new Image()
      img.decoding = 'sync'
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
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
