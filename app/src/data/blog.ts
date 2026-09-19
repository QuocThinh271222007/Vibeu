/** A slug into blog_categories ("Danh mục"), managed from /admin/blog-categories — no longer
 * a fixed union. Use useBlogCategories()'s `labelFor` to resolve it to a display name. */
export type BlogCategory = string

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

/** Ordered rich content a post is built from — see AdminBlogEditor.tsx's block editor and
 * BlogPost.tsx's renderer. Headings are h2/h3 only; the post title itself is the page's h1.
 * A `paragraph` block's `text` is sanitized inline-rich HTML (bold/italic/underline/strike,
 * font size, text color, alignment) from RichBlockEditor.tsx, not plain text — legacy posts
 * saved before that existed just have plain text in the same field, which renders identically
 * since plain text has nothing for the HTML renderer to interpret. */
export type ContentBlock =
  | { type: 'heading2' | 'heading3' | 'paragraph'; text: string }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'table'; html: string }

/** A "Mục lục" — an editorial collection grouping several blog posts together (e.g. "Series
 * chăm sóc da tay"), managed from /admin/blog-series and optionally attached to a post
 * (BlogPost.seriesId). Not to be confused with the per-post in-page heading outline BlogPost.tsx
 * auto-builds from that one post's own H2/H3 blocks — this groups multiple posts instead. */
export interface BlogSeries {
  id: string
  slug: string
  name: string
  description: string
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
  /** Plain-text mirror of contentBlocks' paragraph/heading text — kept for any post that
   * predates contentBlocks; BlogPost.tsx only falls back to this when contentBlocks is empty. */
  content: string[]
  contentBlocks: ContentBlock[]
  /** Sanitized HTML body from the WYSIWYG admin editor — BlogPost.tsx renders this when
   * non-empty, falling back to contentBlocks/content for posts saved before this existed. */
  contentHtml: string
  /** A specific Facebook post to embed in the sidebar's "VIBEU trên Facebook" card on the public
   * page — null hides the card. One specific post embeds far more reliably than the full
   * Facebook Page Plugin (no adaptive-resize/lazy-load edge cases). */
  facebookPostUrl: string | null
  /** SEO fields from the content team's writing template (meta description 120-150 chars,
   * primary/secondary keyword) — metaDescription feeds <meta name="description">, both
   * keywords feed <meta name="keywords"> on the post page. Never rendered as visible copy. */
  metaDescription: string
  primaryKeyword: string
  secondaryKeyword: string
  /** Closing credit line per the writing template ("Bài viết và hình ảnh được thực hiện bởi
   * VIBEU") — editable per post from the admin editor, rendered as the page's last line. */
  creditLine: string
  /** Editorial opt-out for the auto-generated table of contents (built from this post's own
   * heading2/heading3 blocks) — see buildHeadingIds in BlogPost.tsx. */
  showToc: boolean
  /** Call-to-action banner rendered after the post's own content — per-post so a
   * Studio-focused post can point at /studio while another points elsewhere. */
  ctaEnabled: boolean
  ctaTitle: string
  ctaButtonLabel: string
  ctaButtonUrl: string
  /** Which Mục lục (see BlogSeries) this post belongs to, if any. */
  seriesId: string | null
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
