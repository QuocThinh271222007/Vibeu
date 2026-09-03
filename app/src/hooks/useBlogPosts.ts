import { useEffect, useState } from 'react'
import { BLOG_POSTS, type BlogPost } from '@/data/blog'
import { fetchPublishedBlogPosts } from '@/lib/blogApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

/**
 * The site's editorial seed posts, plus any posts an admin published from /admin — merged and
 * sorted so the reader never has to know which storage a given post came from. Static posts
 * stay first-class content (not a "fallback") since they ship with the app regardless of
 * whether a Supabase project is connected yet.
 */
export function useBlogPosts(): { posts: BlogPost[]; loading: boolean } {
  const [remote, setRemote] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)

  useEffect(() => {
    if (!isSupabaseConfigured) return
    let cancelled = false
    fetchPublishedBlogPosts().then((posts) => {
      if (!cancelled) {
        setRemote(posts)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  const bySlug = new Map<string, BlogPost>()
  for (const p of BLOG_POSTS) bySlug.set(p.slug, p)
  for (const p of remote) bySlug.set(p.slug, p)
  const posts = [...bySlug.values()].sort((a, b) => (a.date < b.date ? 1 : -1))

  return { posts, loading }
}
