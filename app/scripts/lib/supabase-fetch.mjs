// Shared between generate-sitemap.mjs and prerender.mjs so "which blog posts are public" is
// defined in exactly one place — the sitemap and the prerender pass must never disagree about
// that, or sitemap.xml would advertise URLs that either don't exist as static files or aren't
// meant to be public yet.
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export function loadEnvLocal() {
  const path = join(__dirname, '..', '..', '.env.local')
  if (!existsSync(path)) return {}
  const env = {}
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim()
  }
  return env
}

const env = loadEnvLocal()
export const SUPABASE_URL = env.VITE_SUPABASE_URL
export const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

export async function fetchTable(table, select, filter) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return []
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}${filter ? `&${filter}` : ''}`
    const res = await fetch(url, { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } })
    if (!res.ok) return []
    return await res.json()
  } catch {
    return []
  }
}

/** Published blog post slugs — the one list both the sitemap and the prerender pass build from. */
export async function fetchPublishedBlogSlugs() {
  const rows = await fetchTable('blog_posts', 'slug', 'published=eq.true')
  return rows.map((r) => r.slug)
}

/** Approved community post ids — same "which community posts are public" question the sitemap
 * and the prerender pass both need answered identically. */
export async function fetchApprovedCommunityPostIds() {
  const rows = await fetchTable('community_posts', 'id', 'approved=eq.true')
  return rows.map((r) => r.id)
}
