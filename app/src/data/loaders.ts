import { useEffect, useMemo, useState } from 'react'
import type { ColorPreset, DecalAsset, HandData, NailLength, NailShape, SkinToneId, StickerCategory } from '@/types/vibeu'
import { handVariantSegment } from '@/data/handVariants'
import { fetchGeometryOverride } from '@/lib/geometryAdminApi'
import { validateHandData } from '@/lib/geometryEditor'

interface ColorManifest {
  presets: ColorPreset[]
}

interface DecalManifest {
  categories: StickerCategory[]
  decals: DecalAsset[]
}

function cachedFetch<T>(url: string): () => Promise<T> {
  let promise: Promise<T> | null = null
  return () => {
    if (!promise) {
      promise = fetch(url).then((r) => {
        if (!r.ok) throw new Error(`Failed to load ${url}`)
        return r.json() as Promise<T>
      })
    }
    return promise
  }
}

const getColorManifest = cachedFetch<ColorManifest>('/assets/colors/manifest.json')
const getStandardDecalManifest = cachedFetch<DecalManifest>('/assets/decals/manifest.json')
const getPremiumDecalManifest = cachedFetch<DecalManifest>('/assets/decals/premium/manifest.json')

const handDataLoaders = new Map<string, () => Promise<HandData>>()
// Bump whenever hand photos/coordinates are recalibrated. Static hosts and browser
// caches may otherwise keep serving an older coordinates.json at the same path even
// after a deployment, making corrected masks appear unchanged in Studio.
const HAND_ASSET_REVISION = '20260905-geometry-r4-matcha-fix'

function getHandDataLoader(
  key: string,
  url: string,
  tone: SkinToneId,
  shape: NailShape,
  length: NailLength,
): () => Promise<HandData> {
  let loader = handDataLoaders.get(key)
  if (!loader) {
    const staticLoader = cachedFetch<HandData>(url)
    loader = async () => {
      const published = await fetchGeometryOverride(tone, shape, length)
      if (published) {
        try {
          return validateHandData(published.coordinates)
        } catch {
          // A malformed remote override must never make Studio unusable.
        }
      }
      return staticLoader()
    }
    handDataLoaders.set(key, loader)
  }
  return loader
}

export function invalidateHandData(tone: SkinToneId, shape: NailShape, length: NailLength): void {
  handDataLoaders.delete(`${tone}:${shape}-${length}`)
}

/**
 * Merges the original flat-vector decal library with the richer illustrated premium pack
 * into one list — same architecture either way (one manifest + a `path` the compositor
 * decodes to pixels), so new/replacement decal packs never require hard-coding individual
 * asset ids anywhere else in the app. `tier` is stamped here (not stored in either raw
 * manifest) purely so the picker UI can group/badge premium items separately per the
 * "separate quality tier until migration is finished" requirement.
 */
async function getDecalManifest(): Promise<DecalManifest> {
  const [standard, premium] = await Promise.all([
    getStandardDecalManifest(),
    getPremiumDecalManifest().catch(() => ({ categories: [], decals: [] }) as DecalManifest),
  ])
  return {
    categories: [...standard.categories, ...premium.categories],
    decals: [
      ...standard.decals.map((d) => ({ ...d, tier: 'standard' as const })),
      ...premium.decals.map((d) => ({ ...d, tier: 'premium' as const })),
    ],
  }
}

/** `shape`/`length` only change anything when a matching hand-variants.ts entry exists;
 * otherwise this resolves the tone's default photo, exactly like before this existed. */
export function getHandData(tone: SkinToneId, shape?: NailShape, length?: NailLength): Promise<HandData> {
  const resolvedShape = shape ?? 'oval'
  const resolvedLength = length ?? 'M'
  const segment = handVariantSegment(tone, resolvedShape, resolvedLength)
  const path = segment ? `/assets/hands/${tone}/${segment}/coordinates.json` : `/assets/hands/${tone}/coordinates.json`
  const url = `${path}?v=${HAND_ASSET_REVISION}`
  return getHandDataLoader(`${tone}:${resolvedShape}-${resolvedLength}`, url, tone, resolvedShape, resolvedLength)()
}

function useAsync<T>(loader: () => Promise<T>, deps: unknown[]): { data: T | null; loading: boolean; error: boolean } {
  const [state, setState] = useState<{ data: T | null; loading: boolean; error: boolean }>({
    data: null,
    loading: true,
    error: false,
  })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true }))
    loader()
      .then((data) => {
        if (alive) setState({ data, loading: false, error: false })
      })
      .catch(() => {
        if (alive) setState({ data: null, loading: false, error: true })
      })
    return () => {
      alive = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

export function useColorPresets() {
  const { data, loading, error } = useAsync(getColorManifest, [])
  return { presets: data?.presets ?? [], loading, error }
}

export function useDecals() {
  const { data, loading, error } = useAsync(getDecalManifest, [])
  return { decals: data?.decals ?? [], categories: data?.categories ?? [], loading, error }
}

/** Library decals + this session's custom uploads, merged and keyed by id — the one lookup HandCanvas and the layers panel both need. */
export function useDecalsById(customDecals: DecalAsset[]): Record<string, DecalAsset> {
  const { decals } = useDecals()
  return useMemo(() => Object.fromEntries([...decals, ...customDecals].map((d) => [d.id, d])), [decals, customDecals])
}

export function useHandData(tone: SkinToneId, shape?: NailShape, length?: NailLength) {
  const { data, loading, error } = useAsync(() => getHandData(tone, shape, length), [tone, shape, length])
  return { hand: data, loading, error }
}

export function decalAssetUrl(path: string) {
  return `/assets/decals/${path}`
}

/** Library decals have a manifest-relative path; custom uploads carry a ready-to-use data: URL. */
export function resolveDecalPath(path: string): string {
  return path.startsWith('data:') || path.startsWith('http') || path.startsWith('/') ? path : decalAssetUrl(path)
}

export function colorSwatchUrl(path: string) {
  return `/assets/colors/${path}`
}

interface MaterialManifest {
  materials: Record<string, string> // effect id -> asset path relative to /assets/materials/
}

let materialManifestPromise: Promise<MaterialManifest | null> | null = null

/**
 * Real material-preview photography/renders are asset-ready (Defect A) but not guaranteed
 * to exist yet — resolves null (never throws) when public/assets/materials/manifest.json
 * is absent, so callers can fall back to the deterministic canvas swatch without an error.
 */
function getMaterialManifest(): Promise<MaterialManifest | null> {
  if (!materialManifestPromise) {
    materialManifestPromise = fetch('/assets/materials/manifest.json')
      .then((r) => (r.ok ? (r.json() as Promise<MaterialManifest>) : null))
      .catch(() => null)
  }
  return materialManifestPromise
}

export async function getMaterialPreviewUrl(effectId: string): Promise<string | null> {
  const manifest = await getMaterialManifest()
  const rel = manifest?.materials?.[effectId]
  return rel ? `/assets/materials/${rel}` : null
}

export function handBaseUrl(tone: SkinToneId, shape?: NailShape, length?: NailLength) {
  const segment = handVariantSegment(tone, shape, length)
  const path = segment ? `/assets/hands/${tone}/${segment}/base.jpg` : `/assets/hands/${tone}/base.jpg`
  return `${path}?v=${HAND_ASSET_REVISION}`
}

export async function getPresetById(id: string): Promise<ColorPreset | undefined> {
  const m = await getColorManifest()
  return m.presets.find((p) => p.id === id)
}

export async function getDecalById(id: string): Promise<DecalAsset | undefined> {
  const m = await getDecalManifest()
  return m.decals.find((d) => d.id === id)
}

export async function getAllPresets(): Promise<ColorPreset[]> {
  return (await getColorManifest()).presets
}

export async function getAllDecals(): Promise<DecalAsset[]> {
  return (await getDecalManifest()).decals
}
