import { useEffect, useState } from 'react'
import { getAllTemplatesAsync } from '@/data/templates'
import { fetchTemplatesByIds } from '@/lib/templatesApi'
import type { Template } from '@/types/vibeu'

/** Fixed slot count for the homepage Hero's 3 floating showcase cards (src/components/home/Hero.tsx). */
export const HOMEPAGE_SHOWCASE_SLOT_COUNT = 3

/** Starter picks used until the admin configures real ones (site_settings.homepage_showcase_
 * template_ids is empty). Deliberately picked from the library's lightest rows (each template's
 * `fingers` JSON can range from under 1KB to 1MB+ for a heavily hand-drawn one — see the
 * 2026-09-26 egress incident) and confirmed to actually exist: the original hardcoded picks here
 * had all quietly become deleted templates, and useHomepageShowcaseTemplates' full-table fallback
 * for backfilling a miss is too slow to finish inside prerender.mjs's fixed settle delay, which
 * left the *prerendered* (crawler-facing) snapshot's cards empty even though a real visitor's
 * browser filled them in fine a moment later. Ids that resolve on the first, fast by-id fetch
 * sidestep that race entirely. */
export const DEFAULT_HOMEPAGE_SHOWCASE_IDS = ['anh-dao', 'sweet-ribbon', 'vanilla-dot']

/** Resolves a fixed list of "pick these ids" template slots (homepage Hero's floating cards,
 * SuggestedDesigns' featured picks, ...) against the live template list, backfilling any slot
 * whose id no longer exists (template deleted/renamed) from the rest of the library — so a stale
 * id left in a hardcoded/admin-configured list never just quietly renders nothing. */
export function resolveTemplatePicks(templates: Template[], ids: string[], slotCount: number): Template[] {
  const byId = new Map(templates.map((t) => [t.id, t]))
  const picked: Template[] = []
  const usedIds = new Set<string>()
  for (const id of ids) {
    const t = byId.get(id)
    if (!t || usedIds.has(id)) continue
    picked.push(t)
    usedIds.add(id)
    if (picked.length === slotCount) break
  }
  if (picked.length < slotCount) {
    for (const t of templates) {
      if (picked.length === slotCount) break
      if (usedIds.has(t.id)) continue
      picked.push(t)
      usedIds.add(t.id)
    }
  }
  return picked
}

/** Homepage Hero-specific wrapper — see resolveTemplatePicks. Shared by Hero.tsx's public render
 * and AdminSettings.tsx's editor preview so the two always agree — the admin screen should never
 * show "mẫu đã bị xoá" for a slot the real homepage has already silently replaced. */
export function resolveHomepageShowcase(templates: Template[], configuredIds: string[]): Template[] {
  return resolveTemplatePicks(templates, configuredIds.length ? configuredIds : DEFAULT_HOMEPAGE_SHOWCASE_IDS, HOMEPAGE_SHOWCASE_SLOT_COUNT)
}

/** Coalesces every useTemplatePicks call that fires within the same tick into one Supabase
 * request instead of one per caller. Hero and SuggestedDesigns each want a different, fixed
 * handful of ids, and used to each fire their own `id=in.(...)` fetch — fine in isolation, but
 * every distinct cross-origin URL to Supabase needs its own CORS preflight round trip, and
 * Lighthouse's simulated-mobile-network scoring (Lantern) penalizes that chain depth heavily even
 * though both requests finish in well under a second on a real connection (2026-09-30 perf pass:
 * confirmed via production network trace that every request was long done before Lighthouse's
 * *reported* LCP time — the model, not the real load, was the one penalizing the extra round
 * trip). Batching them into the union of both id sets costs nothing extra for either caller
 * (Supabase already returns full rows for whichever ids exist) and removes one whole preflight+
 * fetch pair from the homepage's critical path. */
let pendingIds = new Set<string>()
let batchPromise: Promise<Template[]> | null = null

function fetchTemplatesByIdsBatched(ids: string[]): Promise<Template[]> {
  for (const id of ids) pendingIds.add(id)
  if (!batchPromise) {
    batchPromise = new Promise((resolve) => {
      setTimeout(() => {
        const idsToFetch = [...pendingIds]
        pendingIds = new Set()
        batchPromise = null
        resolve(fetchTemplatesByIds(idsToFetch))
      }, 0)
    })
  }
  return batchPromise
}

/** Light by-id fetch + full-list-backfill-on-miss for any fixed "pick these ids" section (see
 * resolveTemplatePicks) — generalizes useHomepageShowcaseTemplates below for other spots
 * (SuggestedDesigns' featured picks) that also hardcode a handful of ids and shouldn't pull in
 * the whole ~5MB template table just to render them. */
export function useTemplatePicks(ids: string[], slotCount: number): Template[] {
  const [result, setResult] = useState<Template[]>([])
  const key = ids.join(',')
  useEffect(() => {
    let alive = true
    async function load() {
      const list = key ? key.split(',') : []
      const byId = await fetchTemplatesByIdsBatched(list)
      let resolved = resolveTemplatePicks(byId, list, slotCount)
      if (resolved.length < slotCount) {
        const all = await getAllTemplatesAsync()
        resolved = resolveTemplatePicks(all, list, slotCount)
      }
      if (alive) setResult(resolved)
    }
    void load()
    return () => {
      alive = false
    }
  }, [key, slotCount])
  return result
}

/** What the homepage Hero actually renders — a light by-id fetch in the common case (the
 * configured/starter ids all still exist), only falling back to the full template list (already
 * cached module-wide for Library/Studio/Community — see data/templates.ts — so this doesn't add
 * a second full-table fetch on top) when a configured id no longer resolves and a replacement
 * has to be found. Pulling in the whole ~5MB template table just to pick 3 by id was a real,
 * measured contributor to this project hitting Supabase's free-tier egress quota (2026-09-26). */
export function useHomepageShowcaseTemplates(configuredIds: string[] | undefined): Template[] {
  const ids = configuredIds?.length ? configuredIds : DEFAULT_HOMEPAGE_SHOWCASE_IDS
  return useTemplatePicks(ids, HOMEPAGE_SHOWCASE_SLOT_COUNT)
}
