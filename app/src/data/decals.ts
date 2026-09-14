import type { DecalAsset } from '@/types/vibeu'
import { fetchAllDecals } from '@/lib/decalsApi'

interface StaticDecalManifest {
  categories: unknown[]
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

const getStandardDecalManifest = cachedFetch<StaticDecalManifest>('/assets/decals/manifest.json')
const getPremiumDecalManifest = cachedFetch<StaticDecalManifest>('/assets/decals/premium/manifest.json')

/**
 * Fallback for the window before supabase/migrations/20260915_seed_decals.sql has actually been
 * run (or Supabase isn't configured) — without this, Studio's entire Charm library would render
 * empty the moment this code ships, until someone runs the migration. Once the DB has real rows
 * `fetchAllDecals()` never returns [] again, so this never runs again for the life of the tab —
 * it's a one-time safety net, not a permanent second source of truth (unlike templates.ts,
 * which dropped its static fallback entirely once migrated, decals stayed on this belt-and-
 * braces path since an empty Charm library is a much more visible regression than an empty
 * template library would have been).
 */
async function loadStaticFallbackDecals(): Promise<DecalAsset[]> {
  const [standard, premium] = await Promise.all([
    getStandardDecalManifest().catch(() => ({ categories: [], decals: [] }) as StaticDecalManifest),
    getPremiumDecalManifest().catch(() => ({ categories: [], decals: [] }) as StaticDecalManifest),
  ])
  return [
    ...standard.decals.map((d) => ({ ...d, tier: 'standard' as const })),
    ...premium.decals.map((d) => ({ ...d, tier: 'premium' as const })),
  ]
}

/** All decals — the ~520 migrated built-ins plus anything created from /admin/decals — now live
 * in Supabase (see decalsApi.ts and supabase/migrations/20260915_seed_decals.sql for the
 * one-time migration), same move already made for templates (see data/templates.ts). Fetched
 * once and cached module-wide, kicked off as soon as this module is first imported. */
let remoteDecals: DecalAsset[] = []
let remoteDecalsPromise: Promise<DecalAsset[]> | null = null

function loadRemoteDecals(): Promise<DecalAsset[]> {
  if (!remoteDecalsPromise) {
    remoteDecalsPromise = fetchAllDecals()
      .then((list) => (list.length > 0 ? list : loadStaticFallbackDecals()))
      .catch(() => loadStaticFallbackDecals())
      .then((list) => {
        remoteDecals = list
        return list
      })
  }
  return remoteDecalsPromise
}

void loadRemoteDecals()

/** Drops the memoized fetch and starts a new one immediately — call right after a
 * create/update/delete from /admin/decals succeeds, same reasoning as invalidateTemplates(). */
export function invalidateDecals(): Promise<DecalAsset[]> {
  remoteDecalsPromise = null
  return loadRemoteDecals()
}

export function getAllDecalsSync(): DecalAsset[] {
  return remoteDecals
}

export async function getAllDecalsAsync(): Promise<DecalAsset[]> {
  return loadRemoteDecals()
}
