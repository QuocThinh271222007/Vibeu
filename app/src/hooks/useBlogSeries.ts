import { useEffect, useState } from 'react'
import type { BlogSeries } from '@/data/blog'
import { fetchAllBlogSeries } from '@/lib/blogSeriesApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

/** Every Mục lục (blog series) — used by the public Blog filter and the Admin blog editor's
 * picker. Nothing static/seeded here (unlike useBlogPosts): a series is meaningless until an
 * admin creates one from /admin/blog-series. */
export function useBlogSeries(): { series: BlogSeries[]; loading: boolean } {
  const [series, setSeries] = useState<BlogSeries[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    fetchAllBlogSeries().then((rows) => {
      if (!cancelled) {
        setSeries(rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name, description: r.description })))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  return { series, loading }
}
