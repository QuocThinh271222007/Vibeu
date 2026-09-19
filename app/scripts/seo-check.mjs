// Validates the PRODUCTION OUTPUT (dist/), not the source — run after `npm run build`.
// Usage: npm run seo:check   (exits 1 on any failure)
//
// Route policy encoded here (single place to read it):
//   indexable + prerendered : / /studio /thu-vien /blog /about /chinh-sach /blog/<published slug>
//   noindex (in-app meta)   : /admin/* /auth /reset-password /settings /geometry-editor /r/:id, 404
//   conditional, CSR-only   : /cong-dong/:id /u/:id (in sitemap/left as SPA shell — see prerender.mjs)
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { fetchPublishedBlogSlugs } from './lib/supabase-fetch.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const SITE = 'https://vibeu.design'
const STATIC = ['/', '/studio', '/thu-vien', '/blog', '/about', '/chinh-sach']
const PRIVATE_PREFIXES = ['/admin', '/auth', '/reset-password', '/settings', '/geometry-editor', '/library', '/community', '/r/', '/u/']

const failures = []
const fail = (msg) => failures.push(msg)
const count = (html, re) => (html.match(re) || []).length
const fileFor = (route) => (route === '/' ? join(DIST, 'index.html') : join(DIST, ...route.split('/').filter(Boolean), 'index.html'))
const meta = (html, attr, name) => html.match(new RegExp(`<meta[^>]+${attr}="${name}"[^>]*content="([^"]*)"`, 'i'))?.[1]

function checkPage(route, seen) {
  const f = fileFor(route)
  if (!existsSync(f)) return fail(`${route}: prerendered file missing (${f})`)
  // Comments stripped first: index.html's own explanatory comments mention literal
  // `<meta name="description">` / `<link rel="canonical">` text that isn't a real tag.
  const html = readFileSync(f, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
  if (count(html, /<title[^>]*>[^<]+<\/title>/g) !== 1) fail(`${route}: expected exactly one non-empty <title>`)
  if (/<title[^>]*>VIBEU — Thiết kế nail của riêng bạn<\/title>/.test(html)) fail(`${route}: still carries the generic index.html fallback title`)
  const desc = meta(html, 'name', 'description')
  if (!desc) fail(`${route}: meta description missing`)
  if (count(html, /<meta[^>]*name="description"[^>]*>/g) !== 1) fail(`${route}: expected exactly one meta description tag (incl. empty placeholders)`)
  if (count(html, /<link[^>]*rel="canonical"[^>]*>/g) !== 1) fail(`${route}: expected exactly one canonical link tag (incl. empty placeholders)`)
  if (count(html, /<meta[^>]*name="robots"[^>]*>/g) > 1) fail(`${route}: multiple robots meta tags`)
  const canonical = html.match(/<link[^>]+rel="canonical"[^>]*href="([^"]+)"/i)?.[1]
  const expected = SITE + (route === '/' ? '/' : route)
  if (!canonical) fail(`${route}: canonical missing`)
  else if (canonical !== expected) fail(`${route}: canonical ${canonical} != ${expected}`)
  if (/name="robots"[^>]*noindex/i.test(html)) fail(`${route}: indexable route carries noindex`)
  if (!/<h1[\s>]/i.test(html)) fail(`${route}: no <h1> in raw HTML`)
  for (const p of ['og:title', 'og:description', 'og:url']) if (!meta(html, 'property', p)) fail(`${route}: ${p} missing`)
  if (!meta(html, 'name', 'twitter:card')) fail(`${route}: twitter:card missing`)
  if (route.startsWith('/blog/')) {
    const ld = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => {
      try { return JSON.parse(m[1]) } catch { fail(`${route}: unparseable JSON-LD`); return {} }
    })
    if (!ld.some((o) => o['@type'] === 'BlogPosting')) fail(`${route}: BlogPosting JSON-LD missing`)
    if (!ld.some((o) => o['@type'] === 'BreadcrumbList')) fail(`${route}: BreadcrumbList JSON-LD missing`)
    const title = html.match(/<title[^>]*>([^<]+)<\/title>/)?.[1]
    if (seen.titles.has(title)) fail(`${route}: duplicate title with ${seen.titles.get(title)}`)
    seen.titles.set(title, route)
    if (desc && seen.descs.has(desc)) fail(`${route}: duplicate description with ${seen.descs.get(desc)}`)
    if (desc) seen.descs.set(desc, route)
    if (html.replace(/<[^>]+>/g, ' ').length < 1500) fail(`${route}: article text looks too short in raw HTML`)
  }
  if (route === '/') {
    const types = [...html.matchAll(/"@type":"(Organization|WebSite)"/g)].map((m) => m[1])
    if (!types.includes('Organization') || !types.includes('WebSite')) fail('/: Organization/WebSite JSON-LD missing')
  }
}

async function main() {
  const slugs = await fetchPublishedBlogSlugs()
  const routes = [...STATIC, ...slugs.map((s) => `/blog/${s}`)]
  const seen = { titles: new Map(), descs: new Map() }
  for (const r of routes) checkPage(r, seen)

  // The fallback shell for every non-prerendered route must not carry any page-specific tags.
  const spa = join(DIST, '_spa.html')
  if (!existsSync(spa)) fail('_spa.html (neutral SPA shell) missing')
  else {
    const shell = readFileSync(spa, 'utf8').replace(/<!--[\s\S]*?-->/g, '')
    if (/rel="canonical"|property="og:|name="robots"|application\/ld\+json/.test(shell)) fail('_spa.html carries page-specific head tags')
  }

  const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : ''
  if (!/Sitemap:\s*https:\/\/vibeu\.design\/sitemap\.xml/.test(robots)) fail('robots.txt: Sitemap directive missing')
  if (/Disallow:\s*\/\s*$/m.test(robots)) fail('robots.txt: blocks the whole site')

  const smPath = join(DIST, 'sitemap.xml')
  if (!existsSync(smPath)) fail('sitemap.xml missing from dist')
  else {
    const xml = readFileSync(smPath, 'utf8')
    if (!/^<\?xml/.test(xml) || !xml.includes('</urlset>')) fail('sitemap.xml: not valid urlset XML')
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])
    if (new Set(urls).size !== urls.length) fail('sitemap.xml: duplicate URLs')
    for (const u of urls) {
      const path = u.replace(SITE, '') || '/'
      if (!u.startsWith(SITE + '/')) fail(`sitemap: off-domain URL ${u}`)
      if (PRIVATE_PREFIXES.some((p) => path === p || path.startsWith(p + '/') || path.startsWith(p))) fail(`sitemap: private/redirecting URL ${u}`)
    }
    for (const s of slugs) if (!urls.includes(`${SITE}/blog/${s}`)) fail(`sitemap: published post missing /blog/${s}`)
    console.log(`sitemap: ${urls.length} URLs (${slugs.length} published posts)`)
  }

  console.log(`checked ${routes.length} prerendered routes`)
  if (failures.length) {
    console.error(`\nSEO_CHECK=FAIL (${failures.length})`)
    for (const f of failures) console.error(' -', f)
    process.exit(1)
  }
  console.log('SEO_CHECK=PASS')
}

main()
