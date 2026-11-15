import { useEffect, useMemo, useState } from 'react'
import type { ColorPreset, DecalAsset, HandData, NailLength, NailShape, SkinToneId, StickerCategory } from '@/types/vibeu'
import { handVariantSegment } from '@/data/handVariants'
import { fetchGeometryOverride } from '@/lib/geometryAdminApi'
import { validateHandData } from '@/lib/geometryEditor'
import { getAllTemplates, getAllTemplatesAsync } from '@/data/templates'
import { getAllDecalsAsync } from '@/data/decals'

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
 * Every decal (the ~520 migrated built-ins + anything added from /admin/decals), fetched from
 * Supabase (see data/decals.ts) — the old two-manifest merge (flat-vector + illustrated premium
 * pack) is gone now that both live as `tier` on the same table. `categories` is derived here by
 * grouping the actual decal rows instead of trusting a separately-authored count, so it can
 * never drift out of sync with what's really in the library.
 */
async function getDecalManifest(): Promise<DecalManifest> {
  const decals = await getAllDecalsAsync()
  const categories = new Map<string, StickerCategory>()
  for (const d of decals) {
    const existing = categories.get(d.category)
    if (existing) existing.count += 1
    else categories.set(d.category, { id: d.category, nameVi: d.categoryVi, count: 1 })
  }
  return { decals, categories: [...categories.values()] }
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

/** Static seed templates + admin-created ones from Supabase (see data/templates.ts). Seeds
 * synchronously from whatever's already cached module-wide (non-empty only if some earlier
 * mount on this same page already warmed it) and kicks off/awaits the real fetch itself, then
 * re-renders once it resolves. `loading` lets a caller reserve layout space instead of rendering
 * (and then un-rendering) an empty/"no results" state — Library briefly flashing 0 cards before
 * its grid popped in was a real, measured CLS contributor. */
export function useTemplates() {
  const [templates, setTemplates] = useState(getAllTemplates)
  const [loading, setLoading] = useState(templates.length === 0)
  useEffect(() => {
    let alive = true
    getAllTemplatesAsync().then((list) => {
      if (alive) {
        setTemplates(list)
        setLoading(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])
  return { templates, loading }
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

/** `preview: true` serves the 512x768 `base-sm.jpg` sibling instead of the full 1024x1536 photo —
 * generated once (see the resize pass, 2026-09-30 perf pass) for the marketing/library preview
 * cards (Hero, SuggestedDesigns, Library grid) that render HandCanvas at ~150-300px: those were
 * downloading the same studio-editing-quality image a real Studio canvas needs, at up to 90% waste
 * per instance (confirmed via Lighthouse's image-delivery audit on production). Studio itself still
 * gets the full-resolution photo — accurate paint/lighting there benefits from the extra detail. */
export function handBaseUrl(tone: SkinToneId, shape?: NailShape, length?: NailLength, preview = false) {
  const segment = handVariantSegment(tone, shape, length)
  const file = preview ? 'base-sm.jpg' : 'base.jpg'
  const path = segment ? `/assets/hands/${tone}/${segment}/${file}` : `/assets/hands/${tone}/${file}`
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
