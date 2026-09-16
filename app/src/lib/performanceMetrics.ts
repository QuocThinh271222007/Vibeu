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

  const device = window.innerWidth < 768 ? 'mobile' : 'desktop'
  const path = normalizePath(location.pathname)

  function report(metric: Metric) {
    if (!supabase) return
    void supabase.from('performance_metrics').insert({
      path,
      metric: metric.name,
      value: metric.value,
      rating: metric.rating,
      device,
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
