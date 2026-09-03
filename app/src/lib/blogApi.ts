import type { BlogCategory, BlogPost } from '@/data/blog'
import { supabase } from '@/lib/supabaseClient'

export interface BlogPostRow {
  id: string
  slug: string
  title: string
  category: BlogCategory
  excerpt: string
  content: string[]
  accent_color: string
  cover_src: string | null
  cover_alt: string | null
  author_id: string | null
  published: boolean
  read_minutes: number
  created_at: string
  updated_at: string
}

function mapRowToPost(row: BlogPostRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    accentColor: row.accent_color,
    cover: row.cover_src ? { src: row.cover_src, alt: row.cover_alt ?? '' } : undefined,
    date: row.created_at.slice(0, 10),
    readMinutes: row.read_minutes,
    content: row.content,
  }
}

/** Published posts only, mapped straight into the same BlogPost shape the static seed data uses. */
export async function fetchPublishedBlogPosts(): Promise<BlogPost[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return (data as BlogPostRow[]).map(mapRowToPost)
}

/** Every row regardless of published state — for the /admin list. */
export async function fetchAllBlogPostsAdmin(): Promise<BlogPostRow[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false })
  if (error || !data) return []
  return data as BlogPostRow[]
}

export async function fetchBlogPostByIdAdmin(id: string): Promise<BlogPostRow | null> {
  if (!supabase) return null
  const { data, error } = await supabase.from('blog_posts').select('*').eq('id', id).single()
  if (error || !data) return null
  return data as BlogPostRow
}

export interface BlogPostInput {
  slug: string
  title: string
  category: BlogCategory
  excerpt: string
  content: string[]
  accentColor: string
  coverSrc: string | null
  coverAlt: string | null
  published: boolean
  readMinutes: number
}

export async function createBlogPost(input: BlogPostInput, authorId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_posts').insert({
    slug: input.slug,
    title: input.title,
    category: input.category,
    excerpt: input.excerpt,
    content: input.content,
    accent_color: input.accentColor,
    cover_src: input.coverSrc,
    cover_alt: input.coverAlt,
    published: input.published,
    read_minutes: input.readMinutes,
    author_id: authorId,
  })
  return { error: error?.message ?? null }
}

export async function updateBlogPost(id: string, input: BlogPostInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase
    .from('blog_posts')
    .update({
      slug: input.slug,
      title: input.title,
      category: input.category,
      excerpt: input.excerpt,
      content: input.content,
      accent_color: input.accentColor,
      cover_src: input.coverSrc,
      cover_alt: input.coverAlt,
      published: input.published,
      read_minutes: input.readMinutes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  return { error: error?.message ?? null }
}

export async function deleteBlogPost(id: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: 'Chưa kết nối Supabase.' }
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  return { error: error?.message ?? null }
}
