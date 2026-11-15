// Runs right after `vite build`, before scripts/prerender.mjs. Vite's own compiled CSS
// (dist/assets/index-*.css) was the last remaining render-blocking resource Lighthouse's
// render-blocking-insight audit kept flagging (~390-410ms) across every perf pass this session —
// a real <link rel="stylesheet"> to our own origin still blocks first paint until it downloads,
// however small. Inlining it directly into <head> removes that network round trip entirely: the
// browser has the rules the instant it parses the HTML, no request needed.
//
// This edits dist/index.html BEFORE prerender.mjs runs (not after) — prerender.mjs's very first
// step copies whatever dist/index.html contains into dist/_spa.html and then serves it as the
// base shell for every route it visits, so inlining here once means every prerendered page (and
// the SPA-fallback shell itself) inherits the inlined <style> automatically, with no changes
// needed inside prerender.mjs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DIST = join(__dirname, '..', 'dist')
const indexPath = join(DIST, 'index.html')

if (!existsSync(indexPath)) {
  console.warn('[inline-critical-css] dist/index.html not found — run `vite build` first. Skipping.')
  process.exit(0)
}

const html = readFileSync(indexPath, 'utf8')
const match = html.match(/<link rel="stylesheet" crossorigin href="(\/assets\/index-[^"]+\.css)">/)

if (!match) {
  console.warn('[inline-critical-css] Could not find the compiled CSS <link> tag — skipping (build may have changed shape).')
  process.exit(0)
}

const cssPath = join(DIST, match[1])
if (!existsSync(cssPath)) {
  console.warn(`[inline-critical-css] Referenced CSS file not found at ${cssPath} — skipping.`)
  process.exit(0)
}

const css = readFileSync(cssPath, 'utf8')
const updated = html.replace(match[0], `<style>${css}</style>`)
writeFileSync(indexPath, updated)
console.log(`[inline-critical-css] inlined ${(css.length / 1024).toFixed(1)}KB from ${match[1]}`)
