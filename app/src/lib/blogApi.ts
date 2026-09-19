import type { BlogCategory, BlogPost, ContentBlock } from '@/data/blog'
import { BLOG_COVERS_BUCKET, supabase } from '@/lib/supabaseClient'

const ALLOWED_COVER_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
const MAX_COVER_BYTES = 8 * 1024 * 1024

/** Matches the schema.sql column default — used as a fallback for rows saved before
 * credit_line existed. */
export const DEFAULT_CREDIT_LINE = 'Bài viết và hình ảnh được thực hiện bởi VIBEU'
export const DEFAULT_CTA_TITLE = 'Thử ngay ý tưởng này trên Nail Studio'
export const DEFAULT_CTA_BUTTON_LABEL = 'Bắt đầu thiết kế miễn phí'
export const DEFAULT_CTA_BUTTON_URL = '/studio'

export interface BlogPostRow {
  id: string
  slug: string
  title: string
  category: BlogCategory
  excerpt: string
  content: string[]
  content_blocks: ContentBlock[]
  content_html: string
  facebook_post_url: string | null
  meta_description: string
  primary_keyword: string
  secondary_keyword: string
  credit_line: string
  show_toc: boolean
  cta_enabled: boolean
  cta_title: string
  cta_button_label: string
  cta_button_url: string
  series_id: string | null
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
    updatedAt: row.updated_at,
    readMinutes: row.read_minutes,
    content: row.content,
    contentBlocks: row.content_blocks ?? [],
    contentHtml: row.content_html ?? '',
    facebookPostUrl: row.facebook_post_url ?? null,
    metaDescription: row.meta_description ?? '',
    primaryKeyword: row.primary_keyword ?? '',
    secondaryKeyword: row.secondary_keyword ?? '',
    creditLine: row.credit_line ?? DEFAULT_CREDIT_LINE,
    showToc: row.show_toc ?? true,
    ctaEnabled: row.cta_enabled ?? true,
    ctaTitle: row.cta_title ?? DEFAULT_CTA_TITLE,
    ctaButtonLabel: row.cta_button_label ?? DEFAULT_CTA_BUTTON_LABEL,
    ctaButtonUrl: row.cta_button_url ?? DEFAULT_CTA_BUTTON_URL,
    seriesId: row.series_id ?? null,
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
  contentBlocks: ContentBlock[]
  contentHtml: string
  facebookPostUrl: string | null
  metaDescription: string
  primaryKeyword: string
  secondaryKeyword: string
  creditLine: string
  showToc: boolean
  ctaEnabled: boolean
  ctaTitle: string
  ctaButtonLabel: string
  ctaButtonUrl: string
  seriesId: string | null
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
    content_blocks: input.contentBlocks,
    content_html: input.contentHtml,
    facebook_post_url: input.facebookPostUrl,
    meta_description: input.metaDescription,
    primary_keyword: input.primaryKeyword,
    secondary_keyword: input.secondaryKeyword,
    credit_line: input.creditLine,
    show_toc: input.showToc,
    cta_enabled: input.ctaEnabled,
    cta_title: input.ctaTitle,
    cta_button_label: input.ctaButtonLabel,
    cta_button_url: input.ctaButtonUrl,
    series_id: input.seriesId,
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
      content_blocks: input.contentBlocks,
      content_html: input.contentHtml,
      facebook_post_url: input.facebookPostUrl,
      meta_description: input.metaDescription,
      primary_keyword: input.primaryKeyword,
      secondary_keyword: input.secondaryKeyword,
      credit_line: input.creditLine,
      show_toc: input.showToc,
      cta_enabled: input.ctaEnabled,
      cta_title: input.ctaTitle,
      cta_button_label: input.ctaButtonLabel,
      cta_button_url: input.ctaButtonUrl,
      series_id: input.seriesId,
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

export async function uploadBlogCover(file: File, adminId: string): Promise<{ url: string | null; error: string | null }> {
  if (!supabase) return { url: null, error: 'Chưa kết nối Supabase.' }
  if (!ALLOWED_COVER_TYPES.includes(file.type)) {
    return { url: null, error: 'Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF.' }
  }
  if (file.size > MAX_COVER_BYTES) {
    return { url: null, error: 'Ảnh vượt quá 8MB, hãy chọn ảnh nhẹ hơn.' }
  }
  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${adminId}/${Date.now()}.${ext}`
  const { error } = await supabase.storage.from(BLOG_COVERS_BUCKET).upload(path, file, { upsert: false })
  if (error) return { url: null, error: error.message }
  const { data } = supabase.storage.from(BLOG_COVERS_BUCKET).getPublicUrl(path)
  return { url: data.publicUrl, error: null }
}
