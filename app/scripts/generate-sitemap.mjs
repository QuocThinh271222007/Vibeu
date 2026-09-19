// Regenerated on every build (see package.json's "build" script) so /sitemap.xml stays roughly
// current without needing a live server endpoint — this is a static SPA. A Supabase fetch
// failure (offline dev machine, misconfigured env) must never fail the whole build: falls back
// to the static routes only.
//
// Deliberately excluded from every list below (audited against src/App.tsx's actual routes):
// /admin/*, /auth, /reset-password, /settings, /geometry-editor (all noindex'd in-app — see
// PageMeta's `noindex` prop) — never valid sitemap content regardless of noindex, since a URL
// telling Google "please crawl this" while also telling it "don't index what you find" is
// contradictory; /library, /community, /community/:id (superseded by /thu-vien, /cong-dong,
// /cong-dong/:id — the old slugs are pure redirects, and a sitemap should never point at a
// redirecting URL); /u/:id and /r/:id (thin/personal — see NotFound.tsx and SharedDesign.tsx's
// own noindex for the latter).
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchTable } from './lib/supabase-fetch.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SITE_URL = 'https://vibeu.design'

const STATIC_ROUTES = ['/', '/studio', '/thu-vien', '/cong-dong', '/blog', '/about', '/chinh-sach']

function urlEntry(loc, lastmod) {
  return `  <url>\n    <loc>${SITE_URL}${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ''}\n  </url>`
}

async function main() {
  const seenPaths = new Set()
  const entries = []
  function addEntry(path, lastmod) {
    // Belt-and-suspenders dedupe — nothing here should ever produce a real collision given the
    // route set above, but a sitemap with duplicate URLs is an explicit correctness bug either way.
    if (seenPaths.has(path)) return
    seenPaths.add(path)
    entries.push(urlEntry(path, lastmod))
  }

  for (const path of STATIC_ROUTES) addEntry(path)

  const [blogPosts, communityPosts] = await Promise.all([
    fetchTable('blog_posts', 'slug,updated_at', 'published=eq.true'),
    fetchTable('community_posts', 'id,created_at', 'approved=eq.true'),
  ])

  for (const p of blogPosts) addEntry(`/blog/${p.slug}`, p.updated_at)
  for (const p of communityPosts) addEntry(`/cong-dong/${p.id}`, p.created_at)

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
  writeFileSync(join(__dirname, '..', 'public', 'sitemap.xml'), xml)
  console.log(`sitemap.xml written with ${entries.length} URLs (${blogPosts.length} blog, ${communityPosts.length} community)`)
}

main()
