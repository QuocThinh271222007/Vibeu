import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initPerformanceMonitoring } from '@/lib/performanceMetrics'

initPerformanceMonitoring()

// scripts/prerender.mjs bakes each page's own <title>/description/canonical/OG/JSON-LD into its
// static HTML (for crawlers that never run JS) and tags them data-prerendered. Once React is in
// charge, PageMeta re-renders the right set for whichever route is showing — drop the baked-in
// ones first so a snapshot reused as the shell for another route can't leave stale tags behind.
document.head.querySelectorAll('[data-prerendered]').forEach((el) => el.remove())

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
