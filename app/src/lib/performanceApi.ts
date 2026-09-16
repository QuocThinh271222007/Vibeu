import { supabase } from '@/lib/supabaseClient'

export interface PerformanceMetricRow {
  path: string
  metric: 'LCP' | 'CLS' | 'INP' | 'FCP' | 'TTFB'
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  device: 'mobile' | 'desktop'
  created_at: string
}

/** Bounded to 10k rows — plenty for a 30-day window at this app's traffic, and keeps the
 * /admin/performance page from ever pulling down an unbounded table. */
export async function fetchPerformanceMetrics(sinceHours: number): Promise<PerformanceMetricRow[]> {
  if (!supabase) return []
  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('path, metric, value, rating, device, created_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(10000)
  if (error || !data) return []
  return data as PerformanceMetricRow[]
}
