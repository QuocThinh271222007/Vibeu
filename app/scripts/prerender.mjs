// Post-build prerender: turns the client-rendered SPA into real per-route HTML files so crawlers
// and link-preview bots that don't execute JavaScript still receive the actual page content and
// metadata (title/description/canonical/OG/Twitter/JSON-LD/H1/body) in the raw HTML response.
//
// How it works: serve the freshly built dist/ with `vite preview` (production bundle, SPA
// fallback), drive it with headless Chrome via puppeteer-core, and for each SEO-relevant route
// wait for the app to finish rendering, then write the fully rendered document out as
// dist/<route>/index.html. The same JS bundle is still referenced in every snapshot, so once a
// real browser loads one of these files React takes over and routing/interactivity work as before
// (createRoot re-renders over the static markup — a plain "prerender", not true hydration).
//
// Deliberately NOT prerendered: /admin/*, /auth, /reset-password, /settings (noindex, private),
// /cong-dong/:id, /u/:id, /r/:id (dynamic user content; still fall back to the SPA shell).
//
// Graceful degradation: no Chrome found, or any route failing, logs a warning and leaves that
// route as the plain SPA shell — a missing browser must never fail the whole build.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import puppeteer from 'puppeteer-core'
import { fetchPublishedBlogSlugs } from './lib/supabase-fetch.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const DIST = join(ROOT, 'dist')
const PORT = 4321
const ORIGIN = `http://localhost:${PORT}`

const STATIC_ROUTES = ['/', '/studio', '/thu-vien', '/blog', '/about', '/chinh-sach']

function findChrome() {
  const candidates = [
    process.env.PRERENDER_CHROME_PATH,
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  return candidates.find((p) => existsSync(p))
}

async function waitForServer(timeoutMs = 20000) {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(ORIGIN)
      if (res.ok) return true
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300))
  }
  return false
}

function outputPathFor(route) {
  return route === '/' ? join(DIST, 'index.html') : join(DIST, ...route.split('/').filter(Boolean), 'index.html')
}

async function main() {
  if (!existsSync(join(DIST, 'index.html'))) {
    console.warn('[prerender] dist/index.html not found — run `vite build` first. Skipping.')
    return
  }
  // Re-running without a fresh `vite build`: dist/index.html is already a prerendered page, so put
  // the pristine shell back first (otherwise every snapshot would inherit the previous Home's tags).
  if (existsSync(join(DIST, '_spa.html'))) copyFileSync(join(DIST, '_spa.html'), join(DIST, 'index.html'))
  const chrome = findChrome()
  if (!chrome) {
    console.warn('[prerender] No Chrome/Chromium found (set PRERENDER_CHROME_PATH). Skipping — site stays a plain SPA shell.')
    return
  }

  const slugs = await fetchPublishedBlogSlugs()
  const routes = [...STATIC_ROUTES, ...slugs.map((s) => `/blog/${s}`)]

  const viteBin = join(ROOT, 'node_modules', 'vite', 'bin', 'vite.js')
  const server = spawn(process.execPath, [viteBin, 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, stdio: 'ignore' })
  let browser
  try {
    if (!(await waitForServer())) throw new Error('vite preview did not start')
    browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--no-sandbox'] })

    // Snapshots are held in memory and only written once every route has been visited, so the
    // preview server keeps serving the pristine SPA shell for the whole pass.
    const results = []
    for (const route of routes) {
      const page = await browser.newPage()
      try {
        await page.goto(`${ORIGIN}${route}`, { waitUntil: 'networkidle0', timeout: 45000 })
        await page.waitForSelector('h1', { timeout: 15000 })
        // Let post-render effects (head-tag hoisting, scrollspy, animations) settle.
        await new Promise((r) => setTimeout(r, 400))
        const html =
          '<!doctype html>\n' +
          (await page.evaluate(() => {
            // index.html ships a static fallback <title>, and React 19 hoists the page's own <title>
            // alongside it rather than replacing it — a snapshot with two <title>s is ambiguous to
            // crawlers, so keep only the one the browser itself treats as document.title.
            const titles = document.head.querySelectorAll('title')
            titles.forEach((t, i) => {
              if (i > 0) t.remove()
            })
            // React also leaves attribute-less placeholder <meta>/<link> elements behind (created
            // while a lazy route is suspended, never filled in) — an empty canonical or description
            // sitting ahead of the real one is worse than none, so drop every incomplete one.
            document.head
              .querySelectorAll('meta[name]:not([content]), meta[property]:not([content]), link[rel="canonical"]:not([href])')
              .forEach((el) => el.remove())
            // Mark every per-page head tag so src/main.tsx can drop them at boot — otherwise, when
            // a snapshot doubles as the SPA shell for client-side navigation, its (page-specific)
            // tags would linger next to the ones React's PageMeta renders for the next route.
            document.head
              .querySelectorAll(
                'title, meta[name="description"], meta[name="robots"], meta[name^="twitter:"], meta[property^="og:"], link[rel="canonical"], script[type="application/ld+json"]',
              )
              .forEach((el) => el.setAttribute('data-prerendered', ''))
            return document.documentElement.outerHTML
          }))
        results.push({ route, html })
      } catch (err) {
        console.warn(`[prerender] FAILED ${route}: ${err.message} — left as SPA shell`)
      } finally {
        await page.close()
      }
    }
    // Keep the untouched SPA shell: dist/index.html is about to become the prerendered HOME page,
    // but every non-prerendered route (/admin, /auth, /cong-dong/:id, unknown URLs...) must fall
    // back to a shell with NO page-specific head tags — see deploy/nginx.conf.example.
    copyFileSync(join(DIST, 'index.html'), join(DIST, '_spa.html'))
    for (const { route, html } of results) {
      const out = outputPathFor(route)
      mkdirSync(dirname(out), { recursive: true })
      writeFileSync(out, html)
      console.log(`[prerender] ${route}`)
    }
    console.log(`[prerender] done: ${results.length}/${routes.length} routes`)
  } catch (err) {
    console.warn(`[prerender] aborted: ${err.message}`)
  } finally {
    if (browser) await browser.close()
    server.kill()
  }
}

main()
