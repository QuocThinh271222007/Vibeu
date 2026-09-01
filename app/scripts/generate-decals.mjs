// Generates the original nail-decal SVG library for VIBEU (public/assets/decals/).
// Parametric where the motif naturally repeats (flowers, stars, animal-print units,
// gem facets), hand-authored bezier paths where it doesn't (hearts, bows, butterflies,
// fruit, weather/holiday icons, misc symbols). All original artwork produced for this
// project — no external sourcing. Run: `node scripts/generate-decals.mjs`.

import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_ROOT = path.join(__dirname, '..', 'public', 'assets', 'decals')
const SVG_ROOT = path.join(OUT_ROOT, 'svg')

function svgWrap(body) {
  // Explicit width/height (matching the viewBox 1:1) matter here: a decoded <img> with no
  // intrinsic size falls back to the browser's replaced-element default (306x150 in Chrome),
  // which would silently distort every contentBounds fraction computed against naturalWidth/Height.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${body}</svg>`
}

const deg = (d) => (d * Math.PI) / 180
const pt = (cx, cy, r, angleDeg) => [cx + Math.cos(deg(angleDeg)) * r, cy + Math.sin(deg(angleDeg)) * r]
const f1 = (n) => n.toFixed(2)

// ---------------------------------------------------------------------------
// Parametric generators
// ---------------------------------------------------------------------------

function flower({ petals, petalLen = 34, petalWidth = 16, petalColor, petalStroke, centerColor, centerR = 8, rotate = -90, cx = 50, cy = 52 }) {
  let body = ''
  const strokeAttr = petalStroke ? ` stroke="${petalStroke}" stroke-width="1"` : ''
  for (let i = 0; i < petals; i++) {
    const angle = (360 / petals) * i + rotate
    const [px, py] = pt(cx, cy, petalLen * 0.42, angle)
    body += `<ellipse cx="${f1(px)}" cy="${f1(py)}" rx="${f1(petalWidth / 2)}" ry="${f1(petalLen / 2)}" fill="${petalColor}"${strokeAttr} transform="rotate(${f1(angle + 90)} ${f1(px)} ${f1(py)})"/>`
  }
  body += `<circle cx="${cx}" cy="${cy}" r="${centerR}" fill="${centerColor}"/>`
  return body
}

function star({ points, outerR = 40, innerR = 18, color, stroke, rotate = -90, cx = 50, cy = 50 }) {
  let d = ''
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR
    const angle = (360 / (points * 2)) * i + rotate
    const [x, y] = pt(cx, cy, r, angle)
    d += `${i === 0 ? 'M' : 'L'}${f1(x)} ${f1(y)} `
  }
  const strokeAttr = stroke ? ` stroke="${stroke}" stroke-width="1.5"` : ''
  return `<path d="${d}Z" fill="${color}"${strokeAttr}/>`
}

function sparkle4({ size = 42, color, cx = 50, cy = 50 }) {
  // 4-point diamond sparkle with pinched waist — distinct from an N-point star.
  return `<path d="M${cx} ${cy - size} C ${cx + size * 0.12} ${cy - size * 0.12}, ${cx + size} ${cy - size * 0.12}, ${cx + size} ${cy}
    C ${cx + size * 0.12} ${cy + size * 0.12}, ${cx + size * 0.12} ${cy + size * 0.12}, ${cx} ${cy + size}
    C ${cx - size * 0.12} ${cy + size * 0.12}, ${cx - size} ${cy + size * 0.12}, ${cx - size} ${cy}
    C ${cx - size * 0.12} ${cy - size * 0.12}, ${cx - size * 0.12} ${cy - size * 0.12}, ${cx} ${cy - size} Z" fill="${color}"/>`
}

function heartPath({ color, cx = 50, cy = 52, scale = 1 }) {
  const s = scale
  const p = (x, y) => `${f1(cx + (x - 50) * s)} ${f1(cy + (y - 52) * s)}`
  return `<path d="M${p(50, 30)} C ${p(35, 5)}, ${p(5, 15)}, ${p(5, 40)} C ${p(5, 65)}, ${p(30, 78)}, ${p(50, 92)} C ${p(70, 78)}, ${p(95, 65)}, ${p(95, 40)} C ${p(95, 15)}, ${p(65, 5)}, ${p(50, 30)} Z" fill="${color}"/>`
}

function heartOutline({ color, strokeWidth = 5, cx = 50, cy = 52, scale = 1 }) {
  const s = scale
  const p = (x, y) => `${f1(cx + (x - 50) * s)} ${f1(cy + (y - 52) * s)}`
  return `<path d="M${p(50, 30)} C ${p(35, 5)}, ${p(5, 15)}, ${p(5, 40)} C ${p(5, 65)}, ${p(30, 78)}, ${p(50, 92)} C ${p(70, 78)}, ${p(95, 65)}, ${p(95, 40)} C ${p(95, 15)}, ${p(65, 5)}, ${p(50, 30)} Z" fill="none" stroke="${color}" stroke-width="${strokeWidth}"/>`
}

function animalSpot(seedX, seedY, r, color, rot = 0) {
  // Irregular rounded blob (leopard/cow/giraffe-style spot) via a wobbled polygon.
  const pts = []
  const n = 9
  for (let i = 0; i < n; i++) {
    const a = (360 / n) * i
    const wobble = 0.72 + 0.28 * Math.abs(Math.sin(i * 2.3 + seedX))
    const [x, y] = pt(seedX, seedY, r * wobble, a + rot)
    pts.push(`${f1(x)},${f1(y)}`)
  }
  return `<polygon points="${pts.join(' ')}" fill="${color}"/>`
}

function gemFacets({ shape = 'round', color = '#bfe7ff', stroke = '#6fb8e0', cx = 50, cy = 50, r = 38 }) {
  if (shape === 'round') {
    let inner = ''
    for (let i = 0; i < 8; i++) {
      const [x, y] = pt(cx, cy, r * 0.62, (360 / 8) * i)
      inner += `<line x1="${f1(x)}" y1="${f1(y)}" x2="${cx}" y2="${cy}" stroke="${stroke}" stroke-width="1.4"/>`
    }
    return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>${inner}<circle cx="${cx}" cy="${cy}" r="${r * 0.62}" fill="none" stroke="${stroke}" stroke-width="1.4"/>`
  }
  if (shape === 'marquise') {
    return `<path d="M50 10 C 75 25, 75 75, 50 90 C 25 75, 25 25, 50 10 Z" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
      <line x1="50" y1="10" x2="50" y2="90" stroke="${stroke}" stroke-width="1.4"/>
      <line x1="30" y1="30" x2="50" y2="50" stroke="${stroke}" stroke-width="1.2"/>
      <line x1="70" y1="30" x2="50" y2="50" stroke="${stroke}" stroke-width="1.2"/>
      <line x1="30" y1="70" x2="50" y2="50" stroke="${stroke}" stroke-width="1.2"/>
      <line x1="70" y1="70" x2="50" y2="50" stroke="${stroke}" stroke-width="1.2"/>`
  }
  if (shape === 'oval') {
    return `<ellipse cx="${cx}" cy="${cy}" rx="30" ry="40" fill="${color}" stroke="${stroke}" stroke-width="2.5"/>
      <ellipse cx="${cx}" cy="${cy}" rx="16" ry="24" fill="none" stroke="${stroke}" stroke-width="1.4"/>`
  }
  return ''
}

function snowflake({ color = '#bfe3ff', size = 40, branchStyle = 'simple', cx = 50, cy = 50 }) {
  let body = ''
  for (let i = 0; i < 6; i++) {
    const angle = 60 * i
    const [ex, ey] = pt(cx, cy, size, angle)
    body += `<line x1="${cx}" y1="${cy}" x2="${f1(ex)}" y2="${f1(ey)}" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`
    if (branchStyle === 'feathered') {
      for (const frac of [0.45, 0.7]) {
        const [bx, by] = pt(cx, cy, size * frac, angle)
        const [b1x, b1y] = pt(bx, by, size * 0.22, angle + 40)
        const [b2x, b2y] = pt(bx, by, size * 0.22, angle - 40)
        body += `<line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(b1x)}" y2="${f1(b1y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
        body += `<line x1="${f1(bx)}" y1="${f1(by)}" x2="${f1(b2x)}" y2="${f1(b2y)}" stroke="${color}" stroke-width="3" stroke-linecap="round"/>`
      }
    }
  }
  return body
}

// ---------------------------------------------------------------------------
// Decal catalogue
// ---------------------------------------------------------------------------

const decals = []
function add(category, categoryVi, id, name, nameVi, tags, tintable, layerType, svgBody) {
  decals.push({ category, categoryVi, id, name, nameVi, tags, tintable, layerType, svgBody })
}

// --- Floral ---
const FLORAL = 'floral'
const FLORAL_VI = 'Hoa lá'
add(FLORAL, FLORAL_VI, 'daisy-round', 'Round Daisy', 'Hoa cúc tròn', ['flower', 'daisy', 'floral'], false, 'decal', flower({ petals: 8, petalLen: 32, petalWidth: 13, petalColor: '#ffffff', petalStroke: '#e8dcc0', centerColor: '#f6c945' }))
add(FLORAL, FLORAL_VI, 'daisy-thin', 'Thin-petal Daisy', 'Hoa cúc cánh mảnh', ['flower', 'daisy', 'floral'], false, 'decal', flower({ petals: 12, petalLen: 36, petalWidth: 7, petalColor: '#fff4fb', centerColor: '#e8a33d' }))
add(FLORAL, FLORAL_VI, 'sakura', 'Cherry Blossom', 'Hoa anh đào', ['flower', 'sakura', 'spring'], false, 'decal', flower({ petals: 5, petalLen: 30, petalWidth: 20, petalColor: '#f7a8c4', centerColor: '#fde3ee', centerR: 6 }))
add(FLORAL, FLORAL_VI, 'poppy', 'Poppy', 'Hoa anh túc', ['flower', 'poppy', 'red'], false, 'decal', flower({ petals: 4, petalLen: 38, petalWidth: 26, petalColor: '#e6483f', centerColor: '#2b2320', centerR: 9 }))
add(FLORAL, FLORAL_VI, 'sunflower', 'Sunflower', 'Hoa hướng dương', ['flower', 'sunflower', 'yellow'], false, 'decal', flower({ petals: 13, petalLen: 36, petalWidth: 8, petalColor: '#f7c948', centerColor: '#6b4a2c', centerR: 12 }))
add(FLORAL, FLORAL_VI, 'forget-me-not', 'Forget-me-not Cluster', 'Cụm hoa lưu ly', ['flower', 'ditsy', 'blue'], false, 'decal', flower({ petals: 5, petalLen: 14, petalWidth: 8, petalColor: '#8fb6ef', centerColor: '#fbe27a', centerR: 3, cx: 35, cy: 35 }) + flower({ petals: 5, petalLen: 12, petalWidth: 7, petalColor: '#a9c8f2', centerColor: '#fbe27a', centerR: 3, cx: 65, cy: 60 }))
add(FLORAL, FLORAL_VI, 'hibiscus', 'Hibiscus', 'Hoa dâm bụt', ['flower', 'hibiscus', 'tropical'], false, 'decal', flower({ petals: 5, petalLen: 40, petalWidth: 22, petalColor: '#f0567a', centerColor: '#ffd873', centerR: 5 }) + `<line x1="50" y1="52" x2="50" y2="20" stroke="#ffd873" stroke-width="2.5"/>`)
add(FLORAL, FLORAL_VI, 'tulip', 'Tulip', 'Hoa tulip', ['flower', 'tulip'], false, 'decal', `<path d="M50 20 C 30 20, 25 45, 35 55 C 25 55, 20 42, 15 50 C 20 65, 38 62, 50 78 C 62 62, 80 65, 85 50 C 80 42, 75 55, 65 55 C 75 45, 70 20, 50 20 Z" fill="#e8578f"/><line x1="50" y1="78" x2="50" y2="92" stroke="#5c9a5c" stroke-width="3"/>`)
add(FLORAL, FLORAL_VI, 'rose-swirl', 'Rose Swirl', 'Hoa hồng xoáy', ['flower', 'rose'], false, 'decal', `<path d="M50 50 m-30 0 a30 30 0 1 1 60 0 a22 22 0 1 1 -44 0 a14 14 0 1 1 28 0 a7 7 0 1 1 -14 0" fill="none" stroke="#d8446b" stroke-width="6" stroke-linecap="round"/>`)
add(FLORAL, FLORAL_VI, 'orchid', 'Orchid', 'Hoa lan', ['flower', 'orchid'], false, 'decal', flower({ petals: 5, petalLen: 34, petalWidth: 18, petalColor: '#c9a0e8', centerColor: '#7d3fa8', centerR: 6 }))
add(FLORAL, FLORAL_VI, 'leaf-sprig', 'Leaf Sprig', 'Cành lá', ['leaf', 'sprig', 'green'], false, 'decal', `<path d="M50 90 L50 20" stroke="#4c8a5c" stroke-width="3"/>${[25, 40, 55, 70].map((y, i) => `<path d="M50 ${y} Q ${i % 2 ? 30 : 70} ${y - 8} 50 ${y - 16} Q ${i % 2 ? 70 : 30} ${y - 8} 50 ${y}" fill="#5ba26b"/>`).join('')}`)
add(FLORAL, FLORAL_VI, 'daisy-chain', 'Ditsy Flower Trio', 'Chùm hoa nhỏ', ['flower', 'ditsy'], false, 'decal', flower({ petals: 6, petalLen: 16, petalWidth: 9, petalColor: '#fff', petalStroke: '#e8dcc0', centerColor: '#f6c945', centerR: 3, cx: 30, cy: 30 }) + flower({ petals: 6, petalLen: 14, petalWidth: 8, petalColor: '#fdeaf3', centerColor: '#f6c945', centerR: 3, cx: 65, cy: 45 }) + flower({ petals: 6, petalLen: 15, petalWidth: 8, petalColor: '#fff', petalStroke: '#e8dcc0', centerColor: '#f6c945', centerR: 3, cx: 45, cy: 70 }))

// --- Hearts / Love ---
const HEART = 'hearts'
const HEART_VI = 'Trái tim'
add(HEART, HEART_VI, 'heart-solid', 'Solid Heart', 'Trái tim đầy', ['heart', 'love'], true, 'decal', heartPath({ color: '#e8547b' }))
add(HEART, HEART_VI, 'heart-outline', 'Heart Outline', 'Trái tim viền', ['heart', 'love', 'outline'], true, 'decal', heartOutline({ color: '#e8547b' }))
add(HEART, HEART_VI, 'heart-double', 'Double Heart', 'Đôi trái tim', ['heart', 'love'], true, 'decal', heartPath({ color: '#f28ba6', cx: 38, cy: 42, scale: 0.62 }) + heartPath({ color: '#e8547b', cx: 62, cy: 58, scale: 0.62 }))
add(HEART, HEART_VI, 'heart-arrow', 'Heart with Arrow', 'Tim mũi tên', ['heart', 'love', 'arrow'], true, 'decal', heartPath({ color: '#e8547b', scale: 0.85 }) + `<line x1="10" y1="80" x2="90" y2="20" stroke="#5a4636" stroke-width="3"/><path d="M90 20 L78 22 L88 32 Z" fill="#5a4636"/>`)
add(HEART, HEART_VI, 'heart-lace', 'Lace-trim Heart', 'Tim viền ren', ['heart', 'love', 'lace'], true, 'decal', heartOutline({ color: '#d8446b', strokeWidth: 4 }) + Array.from({ length: 10 }, (_, i) => { const a = 160 + i * 22; const [x, y] = pt(50, 50, 42, a); return `<circle cx="${f1(x)}" cy="${f1(y)}" r="3" fill="#d8446b"/>` }).join(''))
add(HEART, HEART_VI, 'heart-wings', 'Winged Heart', 'Tim cánh thiên thần', ['heart', 'love', 'wings'], true, 'decal', `<path d="M15 45 C 0 35, 0 55, 20 60 C 8 62, 5 70, 20 72 Z" fill="#f4c9d8"/><path d="M85 45 C 100 35, 100 55, 80 60 C 92 62, 95 70, 80 72 Z" fill="#f4c9d8"/>` + heartPath({ color: '#e8547b', scale: 0.75 }))
add(HEART, HEART_VI, 'heart-broken', 'Broken Heart', 'Trái tim vỡ', ['heart', 'broken'], true, 'decal', heartPath({ color: '#8890a8' }) + `<path d="M50 30 L44 55 L54 62 L46 90" fill="none" stroke="#fdf7fa" stroke-width="3"/>`)
add(HEART, HEART_VI, 'love-knot', 'Love Knot', 'Nút thắt tình yêu', ['heart', 'knot', 'infinity'], true, 'decal', `<path d="M30 50 a15 15 0 1 0 0.1 0 M70 50 a15 15 0 1 0 -0.1 0" fill="none" stroke="#c9457a" stroke-width="7" stroke-linecap="round"/>`)

// --- Celestial ---
const CEL = 'celestial'
const CEL_VI = 'Ngôi sao & mặt trăng'
add(CEL, CEL_VI, 'star-5', 'Classic Star', 'Ngôi sao 5 cánh', ['star', 'celestial'], true, 'decal', star({ points: 5, outerR: 40, innerR: 16, color: '#f7c948' }))
add(CEL, CEL_VI, 'star-6', 'Six-point Star', 'Ngôi sao 6 cánh', ['star', 'celestial'], true, 'decal', star({ points: 6, outerR: 38, innerR: 20, color: '#8fb6ef' }))
add(CEL, CEL_VI, 'star-8-sparkle', 'Eight-point Sparkle', 'Sao lấp lánh 8 cánh', ['star', 'sparkle'], true, 'decal', star({ points: 8, outerR: 38, innerR: 12, color: '#f5f9ff', stroke: '#a9c9ea' }))
add(CEL, CEL_VI, 'sparkle-diamond', 'Diamond Sparkle', 'Ánh lấp lánh kim cương', ['sparkle', 'twinkle'], true, 'decal', sparkle4({ color: '#eaf3ff' }).replace('/>', ' stroke="#9fc4e8" stroke-width="1.5"/>') + sparkle4({ size: 14, color: '#eaf3ff', cx: 75, cy: 25 }).replace('/>', ' stroke="#9fc4e8" stroke-width="1.5"/>'))
function crescentMoon({ maskId, color = '#e8c65a', cx = 50, cy = 50, r = 40, cutDx = 18, cutR = 32 }) {
  return `<mask id="${maskId}"><rect width="100" height="100" fill="#fff"/><circle cx="${cx + cutDx}" cy="${cy}" r="${cutR}" fill="#000"/></mask><circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}" mask="url(#${maskId})"/>`
}
add(CEL, CEL_VI, 'moon-crescent', 'Crescent Moon', 'Trăng lưỡi liềm', ['moon', 'celestial'], true, 'decal', crescentMoon({ maskId: 'moonCrescentMask' }))
add(CEL, CEL_VI, 'moon-star', 'Moon & Star', 'Trăng và sao', ['moon', 'star'], true, 'decal', crescentMoon({ maskId: 'moonStarMask', cx: 42 }) + star({ points: 5, outerR: 14, innerR: 6, color: '#e8c65a', cx: 78, cy: 30 }))
add(CEL, CEL_VI, 'sun-burst', 'Sun Burst', 'Mặt trời tỏa nắng', ['sun', 'celestial'], true, 'decal', `<circle cx="50" cy="50" r="20" fill="#ffc94a"/>${Array.from({ length: 12 }, (_, i) => { const a = i * 30; const [x1, y1] = pt(50, 50, 26, a); const [x2, y2] = pt(50, 50, 40, a); return `<line x1="${f1(x1)}" y1="${f1(y1)}" x2="${f1(x2)}" y2="${f1(y2)}" stroke="#ffc94a" stroke-width="4" stroke-linecap="round"/>` }).join('')}`)
add(CEL, CEL_VI, 'comet', 'Comet', 'Sao chổi', ['comet', 'celestial'], true, 'decal', `<circle cx="70" cy="30" r="10" fill="#bfe3ff"/><path d="M64 34 L15 85 L40 55 L20 80 L45 50" stroke="#bfe3ff" stroke-width="3" fill="none" stroke-linecap="round" opacity="0.8"/>`)
add(CEL, CEL_VI, 'shooting-star', 'Shooting Star', 'Sao băng', ['star', 'shooting'], true, 'decal', star({ points: 5, outerR: 16, innerR: 6, color: '#f6d55c', cx: 72, cy: 28 }) + `<path d="M65 32 L20 78" stroke="#f6d55c" stroke-width="3" stroke-linecap="round" opacity="0.85"/>`)
add(CEL, CEL_VI, 'constellation', 'Constellation', 'Chòm sao', ['star', 'constellation'], true, 'decal', `<path d="M20 70 L38 40 L60 55 L82 25" stroke="#cdd9f5" stroke-width="1.5" fill="none"/>${[[20, 70], [38, 40], [60, 55], [82, 25]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#eef3ff"/>`).join('')}`)

// --- Butterfly / bugs ---
const BUG = 'butterfly'
const BUG_VI = 'Bướm & côn trùng'
function butterflyWings(color, ornate) {
  const wing = `M50 50 C 20 20, 0 25, 5 45 C 8 60, 30 58, 50 50 C 30 58, 8 75, 12 88 C 20 95, 40 78, 50 50`
  let extra = ''
  if (ornate) extra = `<circle cx="20" cy="38" r="3" fill="#ffffffaa"/><circle cx="80" cy="38" r="3" fill="#ffffffaa"/>`
  return `<path d="${wing}" fill="${color}"/><path d="${wing}" fill="${color}" transform="scale(-1,1) translate(-100,0)"/>${extra}<ellipse cx="50" cy="50" rx="3" ry="20" fill="#3a2c22"/><line x1="49" y1="32" x2="44" y2="20" stroke="#3a2c22" stroke-width="1.5"/><line x1="51" y1="32" x2="56" y2="20" stroke="#3a2c22" stroke-width="1.5"/>`
}
add(BUG, BUG_VI, 'butterfly-classic', 'Classic Butterfly', 'Bướm cổ điển', ['butterfly', 'bug'], false, 'decal', butterflyWings('#c98fd6', false))
add(BUG, BUG_VI, 'butterfly-ornate', 'Ornate Butterfly', 'Bướm hoa văn', ['butterfly', 'bug'], false, 'decal', butterflyWings('#f0a5c8', true))
add(BUG, BUG_VI, 'butterfly-monarch', 'Monarch Butterfly', 'Bướm chúa cam', ['butterfly', 'monarch'], false, 'decal', butterflyWings('#f0902f', false))
add(BUG, BUG_VI, 'moth', 'Moth', 'Bướm đêm', ['moth', 'bug'], false, 'decal', butterflyWings('#8a7a6b', false).replace(/rx="3" ry="20"/, 'rx="4" ry="22"'))
add(BUG, BUG_VI, 'dragonfly', 'Dragonfly', 'Chuồn chuồn', ['dragonfly', 'bug'], false, 'decal', `<ellipse cx="50" cy="50" rx="3" ry="34" fill="#2f7d6b"/><ellipse cx="30" cy="35" rx="24" ry="7" fill="#bfe9df" opacity="0.8" transform="rotate(-15 30 35)"/><ellipse cx="70" cy="35" rx="24" ry="7" fill="#bfe9df" opacity="0.8" transform="rotate(15 70 35)"/><ellipse cx="32" cy="55" rx="20" ry="6" fill="#bfe9df" opacity="0.8" transform="rotate(10 32 55)"/><ellipse cx="68" cy="55" rx="20" ry="6" fill="#bfe9df" opacity="0.8" transform="rotate(-10 68 55)"/>`)
add(BUG, BUG_VI, 'ladybug', 'Ladybug', 'Bọ rùa', ['ladybug', 'bug'], false, 'decal', `<circle cx="50" cy="55" r="30" fill="#e13a3a"/><line x1="50" y1="25" x2="50" y2="85" stroke="#241c1a" stroke-width="3"/><circle cx="50" cy="30" r="14" fill="#241c1a"/>${[[35, 45], [65, 45], [38, 65], [62, 65], [50, 75]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#241c1a"/>`).join('')}`)
add(BUG, BUG_VI, 'bee', 'Bee', 'Ong', ['bee', 'bug'], false, 'decal', `<ellipse cx="50" cy="55" rx="22" ry="26" fill="#f6c945"/>${[38, 50, 62].map((y) => `<rect x="28" y="${y}" width="44" height="6" fill="#2b2320"/>`).join('')}<ellipse cx="32" cy="35" rx="16" ry="10" fill="#eaf6ff" opacity="0.85" transform="rotate(-20 32 35)"/><ellipse cx="68" cy="35" rx="16" ry="10" fill="#eaf6ff" opacity="0.85" transform="rotate(20 68 35)"/>`)
add(BUG, BUG_VI, 'snail', 'Snail', 'Ốc sên', ['snail', 'bug', 'cute'], false, 'decal', `<circle cx="60" cy="55" r="22" fill="#e8a35a"/><path d="M60 55 m-14 0 a14 14 0 1 1 28 0 a10 10 0 1 1 -20 0 a6 6 0 1 1 12 0" fill="none" stroke="#8a5a2e" stroke-width="3"/><path d="M38 65 C 20 65, 12 75, 15 82 C 30 85, 45 78, 40 65 Z" fill="#a8d99a"/><line x1="20" y1="65" x2="14" y2="52" stroke="#a8d99a" stroke-width="3"/><line x1="26" y1="66" x2="22" y2="53" stroke="#a8d99a" stroke-width="3"/>`)

// --- Bows / ribbon ---
const BOW = 'bows'
const BOW_VI = 'Nơ & ruy băng'
function bowSvg({ color, skinny = false, tails = false }) {
  const loopRy = skinny ? 12 : 20
  let body = `<ellipse cx="28" cy="42" rx="24" ry="${loopRy}" fill="${color}" transform="rotate(-18 28 42)"/><ellipse cx="72" cy="42" rx="24" ry="${loopRy}" fill="${color}" transform="rotate(18 72 42)"/><circle cx="50" cy="45" r="10" fill="${color}"/>`
  if (tails) body += `<path d="M42 52 L30 88 L44 80 Z" fill="${color}"/><path d="M58 52 L70 88 L56 80 Z" fill="${color}"/>`
  return body
}
add(BOW, BOW_VI, 'bow-classic', 'Classic Bow', 'Nơ cổ điển', ['bow', 'ribbon'], true, 'decal', bowSvg({ color: '#e8547b' }))
add(BOW, BOW_VI, 'bow-skinny', 'Skinny Bow', 'Nơ mảnh', ['bow', 'ribbon'], true, 'decal', bowSvg({ color: '#f0a5c8', skinny: true }))
add(BOW, BOW_VI, 'bow-tails', 'Bow with Tails', 'Nơ có dải', ['bow', 'ribbon'], true, 'decal', bowSvg({ color: '#c9457a', tails: true }))
add(BOW, BOW_VI, 'ribbon-curl', 'Ribbon Curl', 'Ruy băng xoăn', ['ribbon', 'curl'], true, 'decal', `<path d="M20 20 C 60 20, 20 50, 60 50 C 20 50, 60 80, 20 80" fill="none" stroke="#e8547b" stroke-width="8" stroke-linecap="round"/>`)
add(BOW, BOW_VI, 'ribbon-banner', 'Ribbon Banner', 'Dải băng ngang', ['ribbon', 'banner'], true, 'decal', `<path d="M10 40 L90 40 L80 50 L90 60 L10 60 L20 50 Z" fill="#8fb6ef"/>`)
add(BOW, BOW_VI, 'bow-double', 'Double-loop Bow', 'Nơ hai tầng', ['bow', 'ribbon'], true, 'decal', bowSvg({ color: '#e8547b' }) + `<ellipse cx="28" cy="42" rx="14" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(-18 28 42)"/><ellipse cx="72" cy="42" rx="14" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(18 72 42)"/>`)

// --- Animal print ---
const ANI = 'animal-print'
const ANI_VI = 'Họa tiết da thú'
add(ANI, ANI_VI, 'leopard-spot', 'Leopard Spot', 'Đốm báo', ['animal', 'leopard', 'print'], false, 'decal', animalSpot(50, 50, 22, '#caa06a') + animalSpot(50, 50, 15, '#3a2c22', 20))
add(ANI, ANI_VI, 'giraffe-patch', 'Giraffe Patch', 'Mảng hươu cao cổ', ['animal', 'giraffe', 'print'], false, 'decal', animalSpot(50, 50, 30, '#caa06a', 45))
add(ANI, ANI_VI, 'cow-patch', 'Cow Patch', 'Mảng bò sữa', ['animal', 'cow', 'print'], false, 'decal', animalSpot(38, 42, 26, '#241c1a', 10) + animalSpot(68, 62, 18, '#241c1a', 50))
add(ANI, ANI_VI, 'zebra-stripe', 'Zebra Stripe', 'Vằn ngựa vằn', ['animal', 'zebra', 'print'], false, 'decal', [15, 35, 55, 75].map((x, i) => `<path d="M${x} 5 Q ${x + (i % 2 ? 15 : -15)} 50, ${x} 95" stroke="#241c1a" stroke-width="7" fill="none"/>`).join(''))
add(ANI, ANI_VI, 'tiger-stripe', 'Tiger Stripe', 'Vằn hổ', ['animal', 'tiger', 'print'], false, 'decal', [10, 35, 60, 82].map((x, i) => `<path d="M${x} 0 Q ${x + (i % 2 ? 25 : -25)} 50, ${x + 10} 100" stroke="#241c1a" stroke-width="9" fill="none" stroke-linecap="round"/>`).join(''))
add(ANI, ANI_VI, 'snake-scale', 'Snake Scale', 'Vảy rắn', ['animal', 'snake', 'print'], false, 'decal', Array.from({ length: 3 }, (_, row) => Array.from({ length: 3 }, (_, col) => `<path d="M${20 + col * 30 - (row % 2) * 15} ${20 + row * 28} a15 12 0 0 1 30 0 a15 12 0 0 1 -30 0" fill="${row % 2 ? '#6b9e7a' : '#5a8a68'}" stroke="#3f6b4c" stroke-width="1"/>`).join('')).join(''))
add(ANI, ANI_VI, 'dalmatian-spot', 'Dalmatian Spot', 'Đốm đốm dalmatian', ['animal', 'dalmatian', 'print'], false, 'decal', animalSpot(38, 35, 14, '#241c1a', 5) + animalSpot(65, 60, 18, '#241c1a', 60) + animalSpot(30, 70, 10, '#241c1a', 30))
add(ANI, ANI_VI, 'cheetah-rosette', 'Cheetah Rosette', 'Đốm hoa hồng báo Cheetah', ['animal', 'cheetah', 'print'], false, 'decal', `<circle cx="50" cy="50" r="16" fill="none" stroke="#3a2c22" stroke-width="6"/><circle cx="50" cy="50" r="7" fill="#caa06a"/>`)

// --- Geometric / line / French tip ---
const GEO = 'geometric'
const GEO_VI = 'Hình học & đường nét'
add(GEO, GEO_VI, 'french-arc-single', 'French Tip Arc', 'Vòng cung French', ['french', 'tip', 'line'], true, 'decal', `<path d="M5 55 Q 50 90 95 55 L95 65 Q 50 100 5 65 Z" fill="#ffffff" stroke="#e0d8ea" stroke-width="1.5"/>`)
add(GEO, GEO_VI, 'french-arc-double', 'Double French Line', 'Hai vòng cung French', ['french', 'tip', 'line'], true, 'decal', `<path d="M5 50 Q 50 82 95 50" stroke="#f0a5c8" stroke-width="4" fill="none"/><path d="M5 62 Q 50 94 95 62" stroke="#e8547b" stroke-width="4" fill="none"/>`)
add(GEO, GEO_VI, 'chevron', 'Chevron', 'Hình chữ V', ['geometric', 'chevron'], true, 'decal', `<path d="M10 30 L50 60 L90 30 M10 55 L50 85 L90 55" stroke="#5a7dc9" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
add(GEO, GEO_VI, 'houndstooth', 'Houndstooth Unit', 'Họa tiết răng chó', ['geometric', 'houndstooth'], true, 'decal', `<path d="M20 20 L50 20 L50 40 L70 40 L70 60 L50 60 L50 80 L30 80 L30 60 L20 60 L20 40 L40 40 L40 20" fill="#241c1a"/>`)
add(GEO, GEO_VI, 'plaid-cross', 'Plaid Cross', 'Ô kẻ caro chéo', ['geometric', 'plaid'], true, 'decal', `<line x1="0" y1="35" x2="100" y2="35" stroke="#c9457a" stroke-width="8"/><line x1="0" y1="65" x2="100" y2="65" stroke="#c9457a" stroke-width="8"/><line x1="35" y1="0" x2="35" y2="100" stroke="#c9457a" stroke-width="8"/><line x1="65" y1="0" x2="65" y2="100" stroke="#c9457a" stroke-width="8"/>`)
add(GEO, GEO_VI, 'checker', 'Checker 2x2', 'Ô caro 2x2', ['geometric', 'checker'], true, 'decal', `<rect x="15" y="15" width="35" height="35" fill="#241c1a"/><rect x="50" y="50" width="35" height="35" fill="#241c1a"/>`)
add(GEO, GEO_VI, 'wavy-line', 'Wavy Line', 'Đường lượn sóng', ['geometric', 'wave', 'line'], true, 'decal', `<path d="M5 50 Q 25 20, 45 50 T 85 50" stroke="#5a7dc9" stroke-width="6" fill="none" stroke-linecap="round"/>`)
add(GEO, GEO_VI, 'marble-vein', 'Marble Vein', 'Vân đá cẩm thạch', ['geometric', 'marble', 'abstract'], true, 'decal', `<path d="M10 20 Q 40 40, 25 60 Q 15 75, 40 85 M60 10 Q 45 35, 70 45 Q 90 55, 75 80" stroke="#b8a894" stroke-width="2.5" fill="none"/>`)
add(GEO, GEO_VI, 'triangle-outline', 'Triangle Outline', 'Tam giác viền', ['geometric', 'triangle'], true, 'decal', `<polygon points="50,15 90,85 10,85" fill="none" stroke="#5a7dc9" stroke-width="5"/>`)
add(GEO, GEO_VI, 'diamond-outline', 'Diamond Outline', 'Kim cương viền', ['geometric', 'diamond'], true, 'decal', `<polygon points="50,10 85,50 50,90 15,50" fill="none" stroke="#c9457a" stroke-width="5"/>`)
add(GEO, GEO_VI, 'dot-cluster', 'Dot Cluster', 'Cụm chấm bi', ['geometric', 'dots', 'polka'], true, 'decal', [[30, 30, 8], [62, 25, 5], [70, 55, 9], [35, 65, 6], [55, 70, 4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8547b"/>`).join(''))
add(GEO, GEO_VI, 'cross-hatch', 'Cross Hatch', 'Đan chéo', ['geometric', 'crosshatch'], true, 'decal', Array.from({ length: 5 }, (_, i) => `<line x1="${i * 22}" y1="0" x2="${i * 22 + 30}" y2="100" stroke="#8890a8" stroke-width="2"/><line x1="${i * 22 + 30}" y1="0" x2="${i * 22}" y2="100" stroke="#8890a8" stroke-width="2"/>`).join(''))
add(GEO, GEO_VI, 'herringbone', 'Herringbone Unit', 'Xương cá', ['geometric', 'herringbone'], true, 'decal', `<path d="M20 20 L50 50 M50 50 L20 80 M50 50 L80 20 M50 50 L80 80" stroke="#3a2c22" stroke-width="6" stroke-linecap="round"/>`)
add(GEO, GEO_VI, 'arrow-line', 'Arrow', 'Mũi tên', ['geometric', 'arrow'], true, 'decal', `<line x1="15" y1="70" x2="80" y2="30" stroke="#3a2c22" stroke-width="5" stroke-linecap="round"/><path d="M80 30 L64 32 L74 46 Z" fill="#3a2c22"/>`)
add(GEO, GEO_VI, 'zigzag', 'Zigzag', 'Đường ziczac', ['geometric', 'zigzag'], true, 'decal', `<path d="M10 30 L30 70 L50 30 L70 70 L90 30" stroke="#5a7dc9" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)

// --- Foil / abstract ---
const FOIL = 'foil-abstract'
const FOIL_VI = 'Foil & trừu tượng'
add(FOIL, FOIL_VI, 'foil-flake', 'Foil Flake Cluster', 'Mảnh foil vụn', ['foil', 'flake', 'abstract'], false, 'decal', [[30, 30, 10], [55, 45, 14], [70, 25, 8], [40, 65, 12], [65, 70, 9]].map(([x, y, r], i) => `<polygon points="${Array.from({ length: 5 }, (_, k) => { const [px, py] = pt(x, y, r * (k % 2 ? 0.5 : 1), (72 * k) - 90 + i * 15); return `${f1(px)},${f1(py)}` }).join(' ')}" fill="${['#f7d774', '#e8b84b', '#fff3c9'][i % 3]}"/>`).join(''))
add(FOIL, FOIL_VI, 'crackle-vein', 'Crackle Vein', 'Vân rạn nứt', ['foil', 'crackle', 'abstract'], false, 'decal', `<path d="M10 10 L40 40 L30 70 L60 60 L50 90 M40 40 L80 30 M60 60 L90 70" stroke="#d4af37" stroke-width="2" fill="none"/>`)
add(FOIL, FOIL_VI, 'marble-swirl', 'Marble Swirl', 'Xoáy đá cẩm thạch', ['foil', 'marble', 'abstract'], false, 'decal', `<path d="M20 50 Q 35 20, 55 35 Q 75 50, 60 65 Q 45 78, 55 90" stroke="#b8a3d6" stroke-width="4" fill="none"/><path d="M15 65 Q 30 55, 40 68" stroke="#d8c9ec" stroke-width="2.5" fill="none"/>`)
add(FOIL, FOIL_VI, 'confetti-burst', 'Confetti Burst', 'Pháo giấy vụn', ['foil', 'confetti', 'party'], false, 'decal', [[30, 30, '#e8547b'], [55, 20, '#5a7dc9'], [70, 45, '#f6c945'], [40, 60, '#5ba26b'], [65, 70, '#c9457a'], [25, 70, '#8fb6ef']].map(([x, y, c], i) => (i % 2 ? `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" fill="${c}" transform="rotate(${i * 30} ${x} ${y})"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`)).join(''))
add(FOIL, FOIL_VI, 'paint-splatter', 'Paint Splatter', 'Vệt sơn văng', ['foil', 'splatter', 'abstract'], false, 'decal', `<circle cx="50" cy="50" r="16" fill="#e8547b"/>${[[70, 30, 5], [25, 30, 4], [75, 65, 6], [30, 70, 5], [55, 20, 3]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8547b"/>`).join('')}`)
add(FOIL, FOIL_VI, 'ink-blot', 'Ink Blot', 'Vệt mực loang', ['foil', 'ink', 'abstract'], false, 'decal', animalSpot(50, 50, 28, '#2b2b3a', 0))
add(FOIL, FOIL_VI, 'gold-fragment', 'Gold Leaf Fragment', 'Mảnh vàng lá', ['foil', 'gold', 'abstract'], false, 'decal', `<polygon points="20,20 60,15 55,45 80,50 45,60 50,85 25,60 10,70 20,45" fill="#d4af37"/>`)
add(FOIL, FOIL_VI, 'glitter-spray', 'Glitter Spray', 'Vệt nhũ bay', ['foil', 'glitter', 'sparkle'], false, 'decal', Array.from({ length: 14 }, (_, i) => { const x = 15 + ((i * 37) % 75); const y = 15 + ((i * 53) % 75); const r = 1.5 + (i % 3); return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff3c9"/>` }).join(''))
add(FOIL, FOIL_VI, 'brush-stroke', 'Brush Stroke', 'Nét cọ', ['foil', 'brush', 'abstract'], false, 'decal', `<path d="M10 60 Q 40 20, 70 45 Q 85 55, 90 35" stroke="#c9457a" stroke-width="10" fill="none" stroke-linecap="round"/>`)
add(FOIL, FOIL_VI, 'paint-drip', 'Paint Drip', 'Giọt sơn chảy', ['foil', 'drip', 'abstract'], false, 'decal', `<rect x="20" y="10" width="60" height="30" fill="#5a7dc9"/><path d="M25 40 Q 25 60, 30 60 Q 35 60, 35 45 M50 40 Q 50 70, 55 70 Q 60 70, 60 42 M70 40 Q 70 55, 75 55 Q 80 55, 78 40" fill="#5a7dc9"/>`)

// --- Fruit ---
const FRUIT = 'fruit'
const FRUIT_VI = 'Trái cây'
add(FRUIT, FRUIT_VI, 'cherry-pair', 'Cherry Pair', 'Cặp quả anh đào', ['fruit', 'cherry'], false, 'decal', `<path d="M45 50 Q40 20 55 10 M55 50 Q65 20 55 10" stroke="#5c8a4a" stroke-width="3" fill="none"/><circle cx="42" cy="62" r="16" fill="#d1273e"/><circle cx="62" cy="68" r="16" fill="#e6435a"/>`)
add(FRUIT, FRUIT_VI, 'strawberry', 'Strawberry', 'Dâu tây', ['fruit', 'strawberry'], false, 'decal', `<path d="M50 30 C 20 30, 15 90, 50 92 C 85 90, 80 30, 50 30 Z" fill="#e6394a"/><path d="M35 25 L50 32 L65 25 L58 15 L50 22 L42 15 Z" fill="#5c8a4a"/>${[[40, 45], [60, 45], [35, 60], [65, 60], [50, 55], [45, 75], [55, 75]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#fce27a"/>`).join('')}`)
add(FRUIT, FRUIT_VI, 'lemon-slice', 'Lemon Slice', 'Lát chanh', ['fruit', 'lemon', 'citrus'], false, 'decal', `<circle cx="50" cy="50" r="38" fill="#fbe067"/><circle cx="50" cy="50" r="30" fill="#fef6c9"/>${Array.from({ length: 8 }, (_, i) => { const a = i * 45; const [x, y] = pt(50, 50, 30, a); return `<line x1="50" y1="50" x2="${f1(x)}" y2="${f1(y)}" stroke="#fbe067" stroke-width="2"/>` }).join('')}`)
add(FRUIT, FRUIT_VI, 'watermelon-slice', 'Watermelon Slice', 'Lát dưa hấu', ['fruit', 'watermelon'], false, 'decal', `<path d="M10 60 A40 40 0 0 1 90 60 Z" fill="#e6394a"/><path d="M10 60 A40 40 0 0 1 90 60 L86 60 A36 36 0 0 0 14 60 Z" fill="#fef6e0"/><path d="M14 60 A36 36 0 0 1 86 60" fill="none" stroke="#3f7d3f" stroke-width="4"/>${[[35, 45], [50, 38], [65, 45], [50, 52]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="2" ry="3.5" fill="#2b2320"/>`).join('')}`)
add(FRUIT, FRUIT_VI, 'pineapple', 'Pineapple', 'Dứa', ['fruit', 'pineapple', 'tropical'], false, 'decal', `<ellipse cx="50" cy="62" rx="24" ry="30" fill="#f0a92e"/>${[0, 1, 2].map((r) => Array.from({ length: 5 }, (_, i) => `<path d="M${30 + i * 10} ${45 + r * 15} l5 8 l5 -8" stroke="#c9820f" stroke-width="1.5" fill="none"/>`).join('')).join('')}<path d="M40 30 L45 8 M50 30 L50 5 M60 30 L55 8" stroke="#5c8a4a" stroke-width="4" stroke-linecap="round"/>`)
add(FRUIT, FRUIT_VI, 'orange-slice', 'Orange Slice', 'Lát cam', ['fruit', 'orange', 'citrus'], false, 'decal', `<circle cx="50" cy="50" r="38" fill="#f0902f"/><circle cx="50" cy="50" r="30" fill="#fbc177"/>${Array.from({ length: 10 }, (_, i) => { const a = i * 36; const [x, y] = pt(50, 50, 30, a); return `<line x1="50" y1="50" x2="${f1(x)}" y2="${f1(y)}" stroke="#f0902f" stroke-width="2"/>` }).join('')}`)
add(FRUIT, FRUIT_VI, 'grapes', 'Grapes', 'Chùm nho', ['fruit', 'grapes'], false, 'decal', [[40, 40], [58, 40], [32, 55], [50, 55], [68, 55], [40, 70], [58, 70], [50, 85]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#7d5aa8"/>`).join('') + `<path d="M50 30 L50 15" stroke="#5c8a4a" stroke-width="3"/>`)
add(FRUIT, FRUIT_VI, 'donut', 'Donut', 'Bánh donut', ['food', 'donut', 'sweet'], false, 'decal', `<circle cx="50" cy="50" r="38" fill="#e8a35a"/><circle cx="50" cy="50" r="36" fill="#f4c98a"/><circle cx="50" cy="50" r="34" fill="#f0567a"/><circle cx="50" cy="50" r="14" fill="#fdf7fa"/>${[[35, 25], [60, 22], [70, 40], [30, 45], [55, 45]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="2.5" fill="#fff" transform="rotate(${x} ${x} ${y})"/>`).join('')}`)

// --- Seasonal / weather ---
const SEA = 'seasonal'
const SEA_VI = 'Mùa & thời tiết'
add(SEA, SEA_VI, 'snowflake-simple', 'Simple Snowflake', 'Bông tuyết đơn giản', ['winter', 'snowflake'], true, 'decal', snowflake({ color: '#cfe8ff', branchStyle: 'simple' }))
add(SEA, SEA_VI, 'snowflake-feathered', 'Feathered Snowflake', 'Bông tuyết cầu kỳ', ['winter', 'snowflake'], true, 'decal', snowflake({ color: '#eaf6ff', branchStyle: 'feathered' }))
add(SEA, SEA_VI, 'snowman', 'Snowman', 'Người tuyết', ['winter', 'snowman'], false, 'decal', `<circle cx="50" cy="72" r="20" fill="#fdfdfd" stroke="#dbe9f2" stroke-width="1.5"/><circle cx="50" cy="42" r="15" fill="#fdfdfd" stroke="#dbe9f2" stroke-width="1.5"/><polygon points="50,42 65,46 50,48" fill="#f0902f"/>${[38, 46, 54].map((y) => `<circle cx="50" cy="${y - 5}" r="1.6" fill="#2b2320"/>`).join('')}${[62, 72, 82].map((y) => `<circle cx="50" cy="${y}" r="1.6" fill="#2b2320"/>`).join('')}`)
add(SEA, SEA_VI, 'pumpkin', 'Pumpkin', 'Bí ngô', ['halloween', 'pumpkin', 'autumn'], false, 'decal', `<ellipse cx="50" cy="58" rx="34" ry="26" fill="#e8752f"/>${[-20, 0, 20].map((dx) => `<line x1="${50 + dx}" y1="34" x2="${50 + dx}" y2="82" stroke="#c95f1f" stroke-width="2"/>`).join('')}<rect x="46" y="18" width="8" height="16" rx="3" fill="#5c8a4a"/>`)
add(SEA, SEA_VI, 'candy-cane', 'Candy Cane', 'Kẹo gậy Giáng sinh', ['christmas', 'candy'], false, 'decal', `<path d="M40 90 L40 45 A20 20 0 0 1 80 45 L80 55" stroke="#fdfdfd" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M40 90 L40 45 A20 20 0 0 1 80 45 L80 55" stroke="#e6394a" stroke-width="14" fill="none" stroke-linecap="round" stroke-dasharray="10 10"/>`)
add(SEA, SEA_VI, 'holly', 'Holly Sprig', 'Cành nhựa ruồi', ['christmas', 'holly'], false, 'decal', `<path d="M30 60 Q10 50 20 35 Q30 40 30 55 Q40 35 55 40 Q50 50 35 58 Z" fill="#3f7d3f"/><path d="M70 60 Q90 50 80 35 Q70 40 70 55 Q60 35 45 40 Q50 50 65 58 Z" fill="#4a8f4a"/>${[[46, 62], [54, 66], [50, 74]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6" fill="#d1273e"/>`).join('')}`)
add(SEA, SEA_VI, 'gift-box', 'Gift Box Bow', 'Nơ hộp quà', ['christmas', 'gift'], false, 'decal', `<rect x="20" y="45" width="60" height="42" fill="#5a7dc9"/><rect x="20" y="60" width="60" height="10" fill="#f6c945"/><rect x="45" y="45" width="10" height="42" fill="#f6c945"/>` + bowSvg({ color: '#f6c945', skinny: true }).replace(/cy="4\d"/g, 'cy="30"'))
add(SEA, SEA_VI, 'autumn-leaf', 'Autumn Leaf', 'Lá mùa thu', ['autumn', 'leaf', 'fall'], false, 'decal', `<path d="M50 15 C 70 25, 85 45, 70 65 C 80 60, 85 68, 78 78 C 65 72, 60 82, 50 90 C 40 82, 35 72, 22 78 C 15 68, 20 60, 30 65 C 15 45, 30 25, 50 15 Z" fill="#d97a2e"/><line x1="50" y1="20" x2="50" y2="88" stroke="#a85a1e" stroke-width="2"/>`)
add(SEA, SEA_VI, 'raindrop', 'Raindrop', 'Giọt mưa', ['weather', 'rain'], true, 'decal', `<path d="M50 10 C 65 35, 80 55, 80 68 A30 30 0 1 1 20 68 C 20 55, 35 35, 50 10 Z" fill="#7fb8e8"/>`)
add(SEA, SEA_VI, 'cloud', 'Cloud', 'Đám mây', ['weather', 'cloud'], true, 'decal', `<g stroke="#a9c3db" stroke-width="1.5"><ellipse cx="35" cy="55" rx="20" ry="16" fill="#f2f8fd"/><ellipse cx="58" cy="48" rx="24" ry="20" fill="#f2f8fd"/><ellipse cx="75" cy="58" rx="16" ry="13" fill="#f2f8fd"/><rect x="25" y="55" width="60" height="16" rx="8" fill="#f2f8fd"/></g>`)
add(SEA, SEA_VI, 'rainbow', 'Rainbow', 'Cầu vồng', ['weather', 'rainbow'], false, 'decal', `<path d="M10 80 A40 40 0 0 1 90 80" fill="none" stroke="#e6394a" stroke-width="6"/><path d="M17 80 A33 33 0 0 1 83 80" fill="none" stroke="#f0902f" stroke-width="6"/><path d="M24 80 A26 26 0 0 1 76 80" fill="none" stroke="#f6c945" stroke-width="6"/><path d="M31 80 A19 19 0 0 1 69 80" fill="none" stroke="#5ba26b" stroke-width="6"/><path d="M38 80 A12 12 0 0 1 62 80" fill="none" stroke="#5a7dc9" stroke-width="6"/>`)

// --- Text / symbols ---
const TXT = 'text-symbols'
const TXT_VI = 'Chữ & ký hiệu'
add(TXT, TXT_VI, 'xo', 'XO', 'Chữ XO', ['text', 'love', 'symbol'], true, 'decal', `<line x1="10" y1="30" x2="35" y2="70" stroke="#c9457a" stroke-width="7" stroke-linecap="round"/><line x1="35" y1="30" x2="10" y2="70" stroke="#c9457a" stroke-width="7" stroke-linecap="round"/><circle cx="70" cy="50" r="20" fill="none" stroke="#c9457a" stroke-width="7"/>`)
add(TXT, TXT_VI, 'infinity', 'Infinity', 'Vô cực', ['text', 'infinity', 'symbol'], true, 'decal', `<path d="M30 50 a14 14 0 1 0 0.1 0 M70 50 a14 14 0 1 0 -0.1 0 M44 50 L56 50" fill="none" stroke="#5a7dc9" stroke-width="7" stroke-linecap="round"/>`)
add(TXT, TXT_VI, 'ampersand-swirl', 'Ampersand Swirl', 'Ký hiệu & xoắn', ['text', 'symbol', 'swirl'], true, 'decal', `<path d="M65 80 C 30 80, 15 55, 35 40 C 55 25, 55 45, 35 55 C 20 62, 25 85, 50 80 C 65 77, 65 65, 55 62" fill="none" stroke="#8a5a2e" stroke-width="6" stroke-linecap="round"/>`)
add(TXT, TXT_VI, 'exclaim-heart', 'Heart Exclamation', 'Chấm than trái tim', ['text', 'symbol'], true, 'decal', `<rect x="45" y="15" width="10" height="35" rx="5" fill="#c9457a"/>` + heartPath({ color: '#c9457a', scale: 0.35, cx: 50, cy: 78 }))
add(TXT, TXT_VI, 'yes-bubble', 'Speech Bubble Check', 'Bong bóng dấu tick', ['text', 'symbol', 'chat'], true, 'decal', `<rect x="10" y="15" width="80" height="55" rx="16" fill="#8fb6ef"/><polygon points="25,68 25,85 42,68" fill="#8fb6ef"/><path d="M30 42 L45 57 L72 28" stroke="#ffffff" stroke-width="7" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
add(TXT, TXT_VI, 'love-script-swirl', 'Love Script Swirl', 'Nét chữ tình yêu', ['text', 'love', 'script'], true, 'decal', `<path d="M15 60 C 15 30, 40 30, 35 50 C 30 65, 15 65, 20 45 C 25 25, 55 20, 55 50 C 55 75, 30 80, 40 60 C 48 45, 70 40, 75 60 C 78 75, 60 82, 65 65" fill="none" stroke="#c9457a" stroke-width="5" stroke-linecap="round"/>`)

// --- Gems / rhinestone flat outline ---
const GEM = 'gems'
const GEM_VI = 'Đá & kim cương (phẳng)'
add(GEM, GEM_VI, 'gem-round', 'Round Gem Outline', 'Đá tròn viền facet', ['gem', 'rhinestone', 'flat'], false, 'decal', gemFacets({ shape: 'round', color: '#cdeaff', stroke: '#6fb8e0' }))
add(GEM, GEM_VI, 'gem-marquise', 'Marquise Gem Outline', 'Đá marquise viền facet', ['gem', 'rhinestone', 'flat'], false, 'decal', gemFacets({ shape: 'marquise', color: '#f7d9ec', stroke: '#d68fc0' }))
add(GEM, GEM_VI, 'gem-oval', 'Oval Gem Outline', 'Đá oval viền facet', ['gem', 'rhinestone', 'flat'], false, 'decal', gemFacets({ shape: 'oval', color: '#e3f7d9', stroke: '#8fc06f' }))
add(GEM, GEM_VI, 'gem-heart', 'Heart Gem Outline', 'Đá trái tim viền facet', ['gem', 'rhinestone', 'flat'], false, 'decal', heartPath({ color: '#ffe3ee', scale: 0.85 }) + heartOutline({ color: '#e08fc0', strokeWidth: 2.5, scale: 0.85 }) + `<line x1="50" y1="35" x2="50" y2="75" stroke="#e08fc0" stroke-width="1.2"/>`)
add(GEM, GEM_VI, 'gem-cluster', 'Gem Cluster (3)', 'Cụm 3 viên đá', ['gem', 'rhinestone', 'flat', 'cluster'], false, 'decal', gemFacets({ shape: 'round', color: '#cdeaff', stroke: '#6fb8e0', cx: 35, cy: 60, r: 18 }) + gemFacets({ shape: 'round', color: '#f7d9ec', stroke: '#d68fc0', cx: 62, cy: 55, r: 22 }) + gemFacets({ shape: 'round', color: '#fff3c9', stroke: '#e0c06f', cx: 70, cy: 78, r: 13 }))
add(GEM, GEM_VI, 'gem-teardrop', 'Teardrop Gem Outline', 'Đá giọt nước viền facet', ['gem', 'rhinestone', 'flat'], false, 'decal', `<path d="M50 10 C 70 35, 82 55, 82 68 A32 32 0 1 1 18 68 C 18 55, 30 35, 50 10 Z" fill="#eaf3ff" stroke="#7fa8d6" stroke-width="2.5"/><line x1="50" y1="20" x2="50" y2="90" stroke="#7fa8d6" stroke-width="1.2"/><line x1="30" y1="55" x2="70" y2="55" stroke="#7fa8d6" stroke-width="1.2"/>`)

// --- Misc symbols ---
const MISC = 'misc'
const MISC_VI = 'Khác'
add(MISC, MISC_VI, 'crown', 'Crown', 'Vương miện', ['crown', 'royal', 'symbol'], true, 'decal', `<path d="M15 70 L15 40 L32 55 L50 30 L68 55 L85 40 L85 70 Z" fill="#f6c945"/>${[15, 50, 85].map((x) => `<circle cx="${x}" cy="38" r="5" fill="#e6394a"/>`).join('')}`)
add(MISC, MISC_VI, 'lightning', 'Lightning Bolt', 'Tia sét', ['lightning', 'bolt', 'symbol'], true, 'decal', `<polygon points="55,10 25,55 45,55 35,90 75,45 52,45" fill="#f6c945"/>`)
add(MISC, MISC_VI, 'flame', 'Flame', 'Ngọn lửa', ['flame', 'fire', 'symbol'], true, 'decal', `<path d="M50 10 C 30 35, 20 50, 30 68 C 25 60, 35 58, 38 65 C 35 45, 55 40, 50 55 C 65 45, 70 60, 62 72 C 78 62, 78 40, 60 20 C 65 35, 55 30, 50 10 Z" fill="#f0902f"/>`)
add(MISC, MISC_VI, 'wave-single', 'Single Wave', 'Sóng đơn', ['wave', 'symbol'], true, 'decal', `<path d="M10 55 Q 30 30, 50 55 T 90 55" stroke="#5a7dc9" stroke-width="7" fill="none" stroke-linecap="round"/>`)
add(MISC, MISC_VI, 'leaf-single', 'Single Leaf', 'Lá đơn', ['leaf', 'nature'], true, 'decal', `<path d="M50 15 C 80 30, 80 70, 50 90 C 20 70, 20 30, 50 15 Z" fill="#5ba26b"/><line x1="50" y1="20" x2="50" y2="85" stroke="#3f7d4c" stroke-width="2"/>`)
add(MISC, MISC_VI, 'feather', 'Feather', 'Lông vũ', ['feather', 'boho'], true, 'decal', `<path d="M50 10 C 65 30, 60 60, 45 90 C 40 70, 42 40, 50 10 Z" fill="#a8c8e8"/>${[25, 40, 55, 70].map((y) => `<line x1="50" y1="${y}" x2="${35 + (y % 20)}" y2="${y - 6}" stroke="#7fa8d6" stroke-width="1.5"/><line x1="50" y1="${y}" x2="${65 - (y % 20)}" y2="${y - 6}" stroke="#7fa8d6" stroke-width="1.5"/>`).join('')}`)
add(MISC, MISC_VI, 'anchor', 'Anchor', 'Mỏ neo', ['anchor', 'nautical'], true, 'decal', `<circle cx="50" cy="20" r="7" fill="none" stroke="#3a5a7d" stroke-width="4"/><line x1="50" y1="27" x2="50" y2="78" stroke="#3a5a7d" stroke-width="5"/><line x1="30" y1="40" x2="70" y2="40" stroke="#3a5a7d" stroke-width="4"/><path d="M50 78 C 30 78, 20 65, 25 50 M50 78 C 70 78, 80 65, 75 50" fill="none" stroke="#3a5a7d" stroke-width="5" stroke-linecap="round"/>`)
add(MISC, MISC_VI, 'mushroom', 'Mushroom', 'Nấm', ['mushroom', 'cute'], false, 'decal', `<path d="M20 45 A30 28 0 0 1 80 45 Z" fill="#e6394a"/>${[[35, 32], [50, 25], [65, 34], [45, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fdf7fa"/>`).join('')}<rect x="38" y="45" width="24" height="30" rx="8" fill="#fdf1de"/>`)
add(MISC, MISC_VI, 'cactus', 'Cactus', 'Xương rồng', ['cactus', 'desert'], true, 'decal', `<rect x="42" y="30" width="16" height="55" rx="8" fill="#5ba26b"/><rect x="22" y="45" width="14" height="26" rx="7" fill="#5ba26b"/><rect x="64" y="38" width="14" height="30" rx="7" fill="#5ba26b"/>`)
add(MISC, MISC_VI, 'palm-tree', 'Palm Tree', 'Cây dừa', ['palm', 'tropical', 'summer'], true, 'decal', `<path d="M50 90 Q 45 60, 52 35" stroke="#8a5a2e" stroke-width="4" fill="none"/>${[-60, -30, 0, 30, 60].map((a) => `<path d="M52 35 Q ${52 + Math.cos(deg(a - 90)) * 30} ${35 + Math.sin(deg(a - 90)) * 20}, ${52 + Math.cos(deg(a - 90)) * 34} ${35 + Math.sin(deg(a - 90)) * 8}" stroke="#3f7d4c" stroke-width="5" fill="none" stroke-linecap="round"/>`).join('')}`)
add(MISC, MISC_VI, 'umbrella', 'Umbrella', 'Cây dù', ['umbrella', 'weather'], false, 'decal', `<path d="M15 45 A35 32 0 0 1 85 45 Z" fill="#e6394a"/><path d="M15 45 A35 32 0 0 1 50 45 Z" fill="#f0567a"/><line x1="50" y1="45" x2="50" y2="88" stroke="#3a2c22" stroke-width="3"/><path d="M50 88 Q40 90 42 80" fill="none" stroke="#3a2c22" stroke-width="3"/>`)
add(MISC, MISC_VI, 'key', 'Key', 'Chìa khóa', ['key', 'symbol'], true, 'decal', `<circle cx="30" cy="35" r="14" fill="none" stroke="#c9a24a" stroke-width="6"/><line x1="42" y1="45" x2="80" y2="83" stroke="#c9a24a" stroke-width="6" stroke-linecap="round"/><line x1="68" y1="71" x2="76" y2="63" stroke="#c9a24a" stroke-width="6"/><line x1="76" y1="79" x2="84" y2="71" stroke="#c9a24a" stroke-width="6"/>`)
add(MISC, MISC_VI, 'balloon', 'Balloon', 'Bóng bay', ['balloon', 'party'], true, 'decal', `<ellipse cx="50" cy="38" rx="26" ry="30" fill="#e8547b"/><polygon points="44,66 56,66 50,76" fill="#e8547b"/><path d="M50 76 Q 55 85, 48 92" stroke="#8890a8" stroke-width="1.5" fill="none"/>`)

// ---------------------------------------------------------------------------
// Write files + manifest
// ---------------------------------------------------------------------------

if (existsSync(SVG_ROOT)) rmSync(SVG_ROOT, { recursive: true })
mkdirSync(SVG_ROOT, { recursive: true })

const categoriesSeen = new Map()
const manifestDecals = []

for (const d of decals) {
  const catDir = path.join(SVG_ROOT, d.category)
  mkdirSync(catDir, { recursive: true })
  const fileName = `${d.id}.svg`
  writeFileSync(path.join(catDir, fileName), svgWrap(d.svgBody), 'utf8')
  categoriesSeen.set(d.category, (categoriesSeen.get(d.category) || { nameVi: d.categoryVi, count: 0 }))
  categoriesSeen.get(d.category).count++
  manifestDecals.push({
    id: d.id,
    name: d.name,
    nameVi: d.nameVi,
    category: d.category,
    categoryVi: d.categoryVi,
    path: `svg/${d.category}/${fileName}`,
    viewBox: [100, 100],
    contentBounds: [0.05, 0.05, 0.9, 0.9],
    defaultScale: 0.6,
    tintable: d.tintable,
    layerType: d.layerType,
    tags: d.tags,
    source: 'Original artwork generated for VIBEU (parametric + hand-authored SVG)',
    license: 'Original / project-owned — free to use within VIBEU',
  })
}

const categories = Array.from(categoriesSeen.entries()).map(([id, v]) => ({ id, nameVi: v.nameVi, count: v.count }))

const manifest = {
  packId: 'vibeu-decal-pack-v1',
  generatedBy: 'scripts/generate-decals.mjs',
  totalDecals: manifestDecals.length,
  categories,
  decals: manifestDecals,
}

writeFileSync(path.join(OUT_ROOT, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8')

console.log(`Generated ${manifestDecals.length} decals across ${categories.length} categories.`)
for (const c of categories) console.log(`  ${c.id}: ${c.count}`)
