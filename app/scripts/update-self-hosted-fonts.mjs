// Re-downloads the self-hosted Baloo 2 + Inter font files (see src/index.css's @font-face rules)
// from Google Fonts' CSS2 API, in case the family/weight list in FONT_QUERY ever changes. Prints
// the new @font-face CSS to paste into src/index.css — doesn't edit it automatically, since the
// unicode-range values are worth a human glance (Google occasionally splits/merges subsets).
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const FONTS_DIR = join(__dirname, '..', 'public', 'assets', 'fonts')

const FONT_QUERY =
  'family=Baloo+2:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700;800&display=swap'

// Only these two subsets: Vietnamese text needs `vietnamese` (the precomposed/combining diacritic
// block) layered on top of `latin` (plain a-z/0-9/punctuation) — see the comment in src/index.css.
const WANTED_SUBSETS = ['latin', 'vietnamese']

async function main() {
  const res = await fetch(`https://fonts.googleapis.com/css2?${FONT_QUERY}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36' },
  })
  const css = await res.text()
  const blocks = css
    .split('/* ')
    .slice(1)
    .map((b) => '/* ' + b.trimEnd())
    .filter((b) => WANTED_SUBSETS.some((s) => b.startsWith(`/* ${s} */`)))

  // Variable fonts: Google repeats the same file per discrete weight — dedupe to one @font-face
  // per (family, subset) using a `font-weight: <min> <max>` range instead.
  const seen = new Map()
  for (const block of blocks) {
    const family = block.match(/font-family: '([^']+)'/)[1]
    const subset = block.match(/\/\* (\w+) \*\//)[1]
    const url = block.match(/url\(([^)]+)\)/)[1]
    const unicodeRange = block.match(/unicode-range: ([^;]+);/)[1]
    const weight = Number(block.match(/font-weight: (\d+)/)[1])
    const key = `${family}:${subset}`
    if (!seen.has(key)) seen.set(key, { family, subset, url, unicodeRange, minWeight: weight, maxWeight: weight })
    const entry = seen.get(key)
    entry.minWeight = Math.min(entry.minWeight, weight)
    entry.maxWeight = Math.max(entry.maxWeight, weight)
  }

  let cssOut = ''
  for (const { family, subset, url, unicodeRange, minWeight, maxWeight } of seen.values()) {
    const slug = `${family.toLowerCase().replace(/\s+/g, '')}-${subset}`
    const dest = join(FONTS_DIR, `${slug}.woff2`)
    const fileRes = await fetch(url)
    writeFileSync(dest, Buffer.from(await fileRes.arrayBuffer()))
    console.log(`[update-self-hosted-fonts] wrote ${dest}`)
    cssOut += `@font-face {\n  font-family: '${family}';\n  font-style: normal;\n  font-weight: ${minWeight} ${maxWeight};\n  font-display: swap;\n  src: url('/assets/fonts/${slug}.woff2') format('woff2');\n  unicode-range: ${unicodeRange};\n}\n`
  }

  console.log('\n--- paste into src/index.css, replacing the existing @font-face rules ---\n')
  console.log(cssOut)
}

main()
