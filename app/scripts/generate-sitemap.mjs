// Regenerated on every build (see package.json's "build" script) so /sitemap.xml stays roughly
// current without needing a live server endpoint — this is a static SPA. A Supabase fetch
// failure (offline dev machine, misconfigured env) must never fail the whole build: falls back
// to the static routes only.
import { writeFileSync, readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://vibeu.design'

function loadEnvLocal() {
  const path = join(__dirname, '..', '.env.local')
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
const SUPABASE_URL = env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY

const STATIC_ROUTES = ['/', '/studio', '/thu-vien', '/cong-dong', '/blog', '/about', '/chinh-sach']

async function fetchTable(table, select, filter) {
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

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${SITE_URL}${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`
}

async function main() {
  const entries = STATIC_ROUTES.map((path) => urlEntry(path))

  const [blogPosts, communityPosts] = await Promise.all([
    fetchTable('blog_posts', 'slug,updated_at', 'published=eq.true'),
    fetchTable('community_posts', 'id,created_at', 'approved=eq.true'),
  ])

  for (const p of blogPosts) entries.push(urlEntry(`/blog/${p.slug}`, p.updated_at))
  for (const p of communityPosts) entries.push(urlEntry(`/cong-dong/${p.id}`, p.created_at))

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  writeFileSync(join(__dirname, '..', 'public', 'sitemap.xml'), xml)
  console.log(`sitemap.xml written with ${entries.length} URLs (${blogPosts.length} blog, ${communityPosts.length} community)`)
}

main()
