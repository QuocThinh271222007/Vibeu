import { useEffect, useMemo, useState } from 'react'
import type { ColorPreset, DecalAsset, HandData, SkinToneId, StickerCategory } from '@/types/vibeu'

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
const getHandCozy = cachedFetch<HandData>('/assets/hands/cozy/coordinates.json')
const getHandMatcha = cachedFetch<HandData>('/assets/hands/matcha/coordinates.json')

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

export function getHandData(tone: SkinToneId): Promise<HandData> {
  return tone === 'cozy' ? getHandCozy() : getHandMatcha()
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

export function useHandData(tone: SkinToneId) {
  const { data, loading, error } = useAsync(() => getHandData(tone), [tone])
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

export function handBaseUrl(tone: SkinToneId) {
  return `/assets/hands/${tone}/base.jpg`
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
