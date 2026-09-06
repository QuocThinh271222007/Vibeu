import type { Template } from '@/types/vibeu'
import { fetchAllTemplates } from '@/lib/templatesApi'

/** All templates — the old built-in set plus everything admin creates — now live in Supabase
 * (see templatesApi.ts and supabase/migrations/20260906_seed_static_content.sql for the
 * one-time migration of the original 21). Fetched once and cached module-wide so `findTemplate`
 * (called synchronously during render by templateLock.ts, Community.tsx, Hero.tsx) can see them
 * too, not just the async `useTemplates()` consumers like Library.tsx. */
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

// Kick the fetch off as soon as this module is first imported (Library/Studio/Community all
// import it near app start), so the sync lookups below are warm well before they're likely needed.
void loadRemoteTemplates()

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
