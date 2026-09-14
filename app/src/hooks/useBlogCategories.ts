import { useEffect, useMemo, useState } from 'react'
import { fetchAllBlogCategories } from '@/lib/blogCategoriesApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export interface BlogCategoryInfo {
  id: string
  slug: string
  name: string
}

/** Every "Danh mục" (blog category), plus a `labelFor` lookup so a component just needs a
 * post's `category` slug to render its display name — falls back to the raw slug for a post
 * whose category was since renamed/deleted, rather than crashing or showing blank. */
export function useBlogCategories(): { categories: BlogCategoryInfo[]; loading: boolean; labelFor: (slug: string) => string } {
  const [categories, setCategories] = useState<BlogCategoryInfo[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    fetchAllBlogCategories().then((rows) => {
      if (!cancelled) {
        setCategories(rows.map((r) => ({ id: r.id, slug: r.slug, name: r.name })))
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const bySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories])
  const labelFor = (slug: string) => bySlug.get(slug) ?? slug

  return { categories, loading, labelFor }
}
