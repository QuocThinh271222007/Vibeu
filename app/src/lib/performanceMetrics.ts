import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals'
import { supabase } from '@/lib/supabaseClient'

/**
 * Real-user Core Web Vitals, reported anonymously to performance_metrics so /admin/performance
 * can show whether the site is actually laggy for visitors (and whether a fix helped) instead of
 * relying on anecdotal reports. Started once from main.tsx. Never runs on /admin/* routes —
 * admin usage (testing, content editing) isn't representative of a customer's experience and
 * would just dilute the numbers that matter.
 */
export function initPerformanceMonitoring(): void {
  if (!supabase) return
  if (location.pathname.startsWith('/admin')) return
  // Vite's dev server compiles modules on demand (no bundling/minification), so TTFB especially
  // reads far worse than a real production load and would just be noise mixed into real visitor
  // data — only report from an actual production build (`npm run build` + preview/deploy).
  if (import.meta.env.DEV) return
  // Same check main.tsx's GA4 loader already uses — Lighthouse/PageSpeed Insights/other automated
  // audits set this, and a synthetic run's numbers would just dilute the real-visitor data this
  // exists to track. Also removes one more Supabase round trip from the page a performance audit
  // is specifically trying to measure (2026-09-30 perf pass).
  if (navigator.webdriver) return

  const device = window.innerWidth < 768 ? 'mobile' : 'desktop'
  const path = normalizePath(location.pathname)

  function report(metric: Metric) {
    if (!supabase) return
    supabase
      .from('performance_metrics')
      .insert({
        path,
        metric: metric.name,
        value: metric.value,
        rating: metric.rating,
        device,
      })
      .then(({ error }) => {
        // Was previously fire-and-forget with no error visibility at all — a schema-cache-not-
        // reloaded or RLS mistake on the DB side would silently drop every single metric with no
        // trace anywhere. Logging (never throwing) costs nothing for real visitors and is the only
        // way to debug "I ran the migration but the dashboard is still empty" from devtools.
        if (error) console.warn('[performanceMetrics] insert failed:', error.message)
      })
  }

  onCLS(report)
  onFCP(report)
  onINP(report)
  onLCP(report)
  onTTFB(report)
}

/** Collapses dynamic route segments (a blog slug, a community post id) into their route
 * pattern so metrics group by page template instead of fragmenting into one bucket per post. */
function normalizePath(pathname: string): string {
  if (pathname.startsWith('/blog/') && pathname !== '/blog/') return '/blog/:slug'
  if (pathname.startsWith('/cong-dong/') && pathname !== '/cong-dong/') return '/cong-dong/:id'
  if (pathname.startsWith('/u/') && pathname !== '/u/') return '/u/:id'
  if (pathname.startsWith('/r/') && pathname !== '/r/') return '/r/:id'
  return pathname
}
