import type { Template } from '@/types/vibeu'
import { fetchAllTemplates } from '@/lib/templatesApi'

/** All templates — the old built-in set plus everything admin creates — now live in Supabase
 * (see templatesApi.ts and supabase/migrations/20260906_seed_static_content.sql for the
 * one-time migration of the original 21). Fetched on first real demand and cached module-wide so
 * `findTemplate` (called synchronously during render by templateLock.ts, PostCard.tsx,
 * CommunityProfile.tsx) can see them too, not just the async `useTemplates()` consumers like
 * Library.tsx. This used to kick off unconditionally the moment this module was first imported —
 * but that module is reachable from the app's main entry chunk, so it fired the ~5MB full-table
 * fetch on *every* route (Home, Blog, About...), not just the ones that actually need it. Callers
 * that rely on the sync `findTemplate` (rather than `getAllTemplatesAsync`/`findTemplateAsync`)
 * must trigger `getAllTemplatesAsync()` themselves first (see Community.tsx/CommunityProfile.tsx). */
let remoteTemplates: Template[] = []
let remoteTemplatesPromise: Promise<Template[]> | null = null

function loadRemoteTemplates(): Promise<Template[]> {
  if (!remoteTemplatesPromise) {
    remoteTemplatesPromise = fetchAllTemplates().then((list) => {
      remoteTemplates = list
      return list
    })
  }
  return remoteTemplatesPromise
}

/** Drops the memoized fetch and starts a new one immediately. Without this, a template
 * created/edited/deleted/hidden via /admin/templates or Studio's "Lưu làm mẫu" never showed up
 * (or never disappeared) anywhere else in the same tab — remoteTemplatesPromise resolves once
 * and every future getAllTemplatesAsync()/findTemplateAsync() call just returned that same
 * stale promise, so even navigating fresh to /library or reopening Studio still read the old
 * list until a full page reload. Call this right after any mutation succeeds. */
export function invalidateTemplates(): Promise<Template[]> {
  remoteTemplatesPromise = null
  return loadRemoteTemplates()
}

export function getAllTemplates(): Template[] {
  return remoteTemplates
}

/** Kicks off (or reuses) the Supabase fetch and returns the list once it resolves — for callers
 * (useTemplates()) that need to react to templates arriving. */
export async function getAllTemplatesAsync(): Promise<Template[]> {
  return loadRemoteTemplates()
}

/** Synchronous lookup — sees templates only after loadRemoteTemplates()/getAllTemplatesAsync()
 * has resolved at least once (fine for templateLock.ts, which always runs after Studio's own
 * template-loading effect has already awaited the async lookup below). */
export function findTemplate(id: string): Template | undefined {
  return remoteTemplates.find((t) => t.id === id)
}

/** Awaits the Supabase fetch if it hasn't resolved yet — use this (not the sync findTemplate)
 * for a fresh deep link (e.g. Studio's `?template=` loader) that might target a template
 * created after this tab's remoteTemplates cache was last warmed. */
export async function findTemplateAsync(id: string): Promise<Template | undefined> {
  const found = findTemplate(id)
  if (found) return found
  await loadRemoteTemplates()
  return findTemplate(id)
}
