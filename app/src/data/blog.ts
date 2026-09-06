export type BlogCategory = 'tips' | 'trend' | 'care'

export const BLOG_CATEGORY_LABEL: Record<BlogCategory, string> = {
  tips: 'Mẹo làm đẹp',
  trend: 'Trend móng mới',
  care: 'Hướng dẫn dưỡng móng',
}

/**
 * Real editorial cover photo/illustration for a post. Optional: a post without one falls
 * back to MediaPlaceholder rather than emoji-on-gradient "cover art" — see Blog.tsx/BlogPost.tsx.
 */
export interface BlogCover {
  src: string
  alt: string
  objectPosition?: string
  credit?: string
  sourceUrl?: string
}

export interface BlogPost {
  slug: string
  title: string
  category: BlogCategory
  excerpt: string
  /** Subtle fallback background tint behind the placeholder — never primary artwork on its own. */
  accentColor: string
  cover?: BlogCover
  date: string
  readMinutes: number
  content: string[]
}

// The original editorial posts have been migrated into Supabase rows (see
// supabase/migrations/20260906_seed_static_content.sql) so they can be edited/deleted from
// /admin — this stays [] as the offline-fallback shape useBlogPosts() merges remote posts into.
export const BLOG_POSTS: BlogPost[] = []


export function findBlogPost(slug: string, posts: BlogPost[] = BLOG_POSTS): BlogPost | undefined {
  return posts.find((p) => p.slug === slug)
}

export function relatedPosts(slug: string, posts: BlogPost[] = BLOG_POSTS, count = 3): BlogPost[] {
  const current = findBlogPost(slug, posts)
  if (!current) return posts.slice(0, count)
  return posts.filter((p) => p.slug !== slug && p.category === current.category).slice(0, count).concat(
    posts.filter((p) => p.slug !== slug && p.category !== current.category),
  ).slice(0, count)
}
