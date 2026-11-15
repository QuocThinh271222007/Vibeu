import { lazy, Suspense, useEffect, useState } from 'react'
import { fingersFromTemplate } from '@/lib/templateUtils'
import { resolveTemplatePreview } from '@/data/curatedPreviews'
import type { Template } from '@/types/vibeu'

// Dynamic, not static — HandCanvas pulls in the whole compositing/lighting pipeline (nailFill,
// nailLighting, strokeRaster, decalCache, geometry...). Home.tsx is the one route App.tsx loads
// eagerly (so "/" doesn't pay a Suspense round-trip), and it reaches this component through
// Hero/SuggestedDesigns — a static import here was quietly pulling all of that Studio-only
// machinery into the shared entry bundle every single route pays for, on top of it also being the
// single biggest chunk of that bundle's own parse/execute time (2026-09-30 perf pass). Splitting
// it into its own chunk means the entry bundle only ever includes it if something actually renders
// it, and pairs naturally with useDeferredMount below — the chunk fetch has the same window to
// happen in as the mount delay already does.
const HandCanvas = lazy(() => import('@/components/studio/HandCanvas').then((m) => ({ default: m.HandCanvas })))

interface TemplatePreviewMediaProps {
  template: Template
  className?: string
  imageClassName?: string
  eager?: boolean
  /** Hints the browser this is the page's likely LCP element — use on at most one image per
   * page (the first/most prominent card), not every eager one. Implies eager. */
  priority?: boolean
  /** Position among sibling cards mounted on the same page load — spreads their (expensive, see
   * useDeferredMount below) HandCanvas fallback mounts across idle time instead of one
   * simultaneous burst. Ignored for `priority`/curated-image cards. */
  staggerIndex?: number
}

/**
 * Marketing/library media surface for a Template.
 *
 * Curated photography is intentionally preferred here because a showcase card
 * has a different quality bar than an editable compositor. If a curated asset
 * is missing or fails to load, the component falls back to the live HandCanvas
 * so legacy templates never render a broken image.
 */
declare global {
  interface Window {
    /** Set by scripts/prerender.mjs before navigation — see useDeferredMount below. */
    __VIBEU_PRERENDER__?: boolean
  }
}

/** HandCanvas runs a real compositing/lighting pipeline (nail-shape trim, decal rasterization,
 * lighting) per instance — genuinely expensive, and a page that shows several template cards at
 * once (Hero's floating cards, SuggestedDesigns' grid) with no curated cover for any of them was
 * mounting half a dozen of these simultaneously on first paint, each producing a 150-300KB inline
 * SVG. That was a real, measured contributor to this project's homepage TBT (2026-09-30 perf
 * pass): browsers had to run all of them synchronously before the page could become interactive.
 * Staggering non-priority instances past the first paint lets the actual LCP candidate (the one
 * `priority` card) render unblocked, and spreads the rest across idle time instead of one burst.
 *
 * Under prerender.mjs specifically, this never promotes past the skeleton at all — not even for
 * the `priority` card, which otherwise mounts immediately (`skip` true). The fixed settle delay
 * there is long enough that every instance, staggered or not, would finish mounting anyway,
 * baking the same multi-hundred-KB SVGs straight into the crawler-facing/first-paint HTML document
 * (this was the rest of that 1.8MB index.html: staggering alone only fixed *runtime* TBT, and only
 * for the non-priority cards). A crawler gets no SEO value from the live art (the template name is
 * already a visible caption) — and neither does a real visitor's first paint, since this is the
 * one visual that's actually cheaper to skip than to serve: showing a plain placeholder here until
 * React hydrates and fills in the real (still `priority`-fast) render is a smaller LCP than
 * shipping a 300KB inline SVG in the document a real visitor has to download before anything
 * paints at all. */
function useDeferredMount(skip: boolean, delayMs: number): boolean {
  const isPrerender = typeof window !== 'undefined' && window.__VIBEU_PRERENDER__ === true
  const [mounted, setMounted] = useState(skip && !isPrerender)
  useEffect(() => {
    if (skip || mounted || isPrerender) return
    const id = window.setTimeout(() => setMounted(true), delayMs)
    return () => window.clearTimeout(id)
  }, [skip, mounted, delayMs, isPrerender])
  return mounted
}

export function TemplatePreviewMedia({
  template,
  className = '',
  imageClassName = '',
  eager = false,
  priority = false,
  staggerIndex = 0,
}: TemplatePreviewMediaProps) {
  const [curatedFailed, setCuratedFailed] = useState(false)
  const preview = resolveTemplatePreview(template)
  const canUseCurated = preview?.type === 'curated' && Boolean(preview.image) && !curatedFailed
  // Only the live-canvas fallback needs deferring — a plain <img> is already cheap.
  const canvasMounted = useDeferredMount(canUseCurated || priority, 150 + Math.min(staggerIndex, 6) * 150)

  return (
    <div data-template-id={template.id} className={`relative overflow-hidden bg-vibe-cream ${className}`}>
      {canUseCurated ? (
        <img
          src={preview!.image}
          alt={preview!.alt ?? template.name}
          className={`h-full w-full object-cover ${imageClassName}`}
          style={{ objectPosition: preview!.objectPosition ?? 'center center' }}
          loading={eager || priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
          decoding="async"
          draggable={false}
          onError={() => setCuratedFailed(true)}
        />
      ) : canvasMounted ? (
        <Suspense fallback={<div className="h-full w-full animate-pulse bg-vibe-cream" />}>
          <HandCanvas skinTone={template.skinTone} fingers={fingersFromTemplate(template)} className="rounded-none" lowResPhoto />
        </Suspense>
      ) : (
        <div className="h-full w-full animate-pulse bg-vibe-cream" />
      )}
    </div>
  )
}
