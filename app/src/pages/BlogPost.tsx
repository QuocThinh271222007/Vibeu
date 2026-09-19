import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, List } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'
import { FacebookGlyph } from '@/components/ui/SocialGlyphs'
import { findBlogPost, relatedPosts, type ContentBlock, type BlogPost as BlogPostType } from '@/data/blog'
import { useBlogPosts } from '@/hooks/useBlogPosts'
import { useBlogCategories } from '@/hooks/useBlogCategories'
import { PageMeta } from '@/components/seo/PageMeta'
import { sanitizeBlogHtml } from '@/lib/blogContentHtml'
import { slugify } from '@/lib/slug'

const VIBEU_FACEBOOK_URL = 'https://www.facebook.com/profile.php?id=61593919006915'

interface HeadingId {
  id: string
  level: 2 | 3
  text: string
}

const RICH_CONTENT_CLASSES =
  'mt-8 space-y-4 text-[15px] leading-relaxed text-vibe-ink/90 ' +
  '[&_h2]:!mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-vibe-ink ' +
  '[&_h3]:!mt-6 [&_h3]:scroll-mt-24 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-vibe-ink ' +
  '[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 ' +
  '[&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-vibe-pink/30 [&_blockquote]:pl-4 [&_blockquote]:italic ' +
  '[&_img]:mt-4 [&_img]:rounded-2xl [&_img]:w-full ' +
  '[&_table]:mt-4 [&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse [&_table]:text-sm ' +
  '[&_th]:border [&_th]:border-vibe-ink/15 [&_th]:bg-vibe-cream [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold ' +
  '[&_td]:border [&_td]:border-vibe-ink/15 [&_td]:px-3 [&_td]:py-2 ' +
  '[&_a]:text-vibe-pink-dark [&_a]:underline [&_strong]:font-semibold'

/** Renders the WYSIWYG editor's sanitized HTML body and, since that HTML has no per-heading id
 * baked in, walks the actually-rendered h2/h3 elements after mount to assign deduped slug ids and
 * report them back up for the Mục lục nav — the HTML equivalent of buildHeadingIds below, which
 * only works on the legacy ContentBlock[] shape. Kept as a fallback: the admin editor moved back
 * to block-based editing, but a post briefly saved through the old whole-document WYSIWYG editor
 * would still have its content here. */
function RichContent({ html, onHeadings }: { html: string; onHeadings: (headings: HeadingId[]) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const safeHtml = sanitizeBlogHtml(html)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const used = new Map<string, number>()
    const headings: HeadingId[] = []
    container.querySelectorAll('h2, h3').forEach((el, i) => {
      const text = el.textContent?.trim() ?? ''
      const base = slugify(text) || `muc-${i}`
      const count = used.get(base) ?? 0
      used.set(base, count + 1)
      const id = count === 0 ? base : `${base}-${count + 1}`
      el.id = id
      headings.push({ id, level: el.tagName === 'H2' ? 2 : 3, text })
    })
    onHeadings(headings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [safeHtml])

  return <div ref={ref} className={RICH_CONTENT_CLASSES} dangerouslySetInnerHTML={{ __html: safeHtml }} />
}

/** Table of contents entries come straight from the post's own heading2/heading3 blocks — no
 * separate authored field to keep in sync. Ids are deduped (two headings with the same text
 * would otherwise collide on the same #anchor) and keyed by block index so the content
 * renderer below can look up the exact same id for its <h2>/<h3>. */
function buildHeadingIds(blocks: ContentBlock[]): Map<number, HeadingId> {
  const used = new Map<string, number>()
  const map = new Map<number, HeadingId>()
  blocks.forEach((block, i) => {
    if (block.type !== 'heading2' && block.type !== 'heading3') return
    const base = slugify(block.text) || `muc-${i}`
    const count = used.get(base) ?? 0
    used.set(base, count + 1)
    map.set(i, { id: count === 0 ? base : `${base}-${count + 1}`, level: block.type === 'heading2' ? 2 : 3, text: block.text })
  })
  return map
}

function CoverMedia({ post, className, compact = false, priority = false }: { post: BlogPostType; className: string; compact?: boolean; priority?: boolean }) {
  return (
    <div className={className} style={{ background: post.cover ? undefined : `${post.accentColor}22` }}>
      {post.cover ? (
        <img
          src={post.cover.src}
          alt={post.cover.alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: post.cover.objectPosition ?? 'center center' }}
          // The single post's own cover is this page's likely LCP element — eager + high
          // priority instead of lazy (lazy-loading the LCP image only delays it).
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      ) : (
        <MediaPlaceholder className="h-full w-full" compact={compact} />
      )}
    </div>
  )
}

/** VIBEU's Facebook Page, embedded via Facebook's iframe Page Plugin — no app id/SDK needed.
 * adapt_container_width lets it fill the sidebar column instead of staying a fixed pixel size. */
function FacebookPageCard() {
  const href = encodeURIComponent(VIBEU_FACEBOOK_URL)
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-vibe-ink/10 bg-white/70 p-4">
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-vibe-ink">
        <FacebookGlyph size={16} className="text-vibe-blue-dark" /> VIBEU trên Facebook
      </p>
      <iframe
        title="Trang Facebook của VIBEU"
        src={`https://www.facebook.com/plugins/page.php?href=${href}&tabs=timeline&width=340&height=420&small_header=true&adapt_container_width=true&hide_cover=false&show_facepile=false`}
        width="340"
        height={420}
        style={{ border: 'none', display: 'block', width: '100%', maxWidth: '340px', overflow: 'hidden', borderRadius: '0.75rem', colorScheme: 'light' }}
        // Not lazy — it sits inside the sidebar's own scroll container, below the TOC and
        // related posts, so a viewport-intersection-based lazy load would only start once
        // scrolled into view and show a stuck spinner in the meantime. Starting the (slow)
        // Facebook round-trip immediately means it's usually ready by the time anyone scrolls
        // down to it.
        allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
      />
    </div>
  )
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { posts, loading } = useBlogPosts()
  const { labelFor } = useBlogCategories()
  const post = slug ? findBlogPost(slug, posts) : undefined
  const [htmlHeadings, setHtmlHeadings] = useState<HeadingId[]>([])

  if (!post) {
    if (loading) return null
    return <Navigate to="/blog" replace />
  }

  const related = relatedPosts(post.slug, posts)
  const usesRichContent = post.contentHtml.trim().length > 0
  const headingIds = buildHeadingIds(post.contentBlocks)
  const tocEntries = usesRichContent ? htmlHeadings : Array.from(headingIds.values())
  const showToc = post.showToc && tocEntries.length >= 2
  const keywords = [post.primaryKeyword, post.secondaryKeyword].filter(Boolean).join(', ')
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.cover?.src,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'VIBEU' },
    publisher: { '@type': 'Organization', name: 'VIBEU' },
  }

  return (
    <div className="max-w-6xl px-4 py-14 sm:px-6 lg:px-10">
      <PageMeta
        title={post.title}
        description={post.metaDescription || post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        image={post.cover?.src}
        type="article"
      />
      {keywords && <meta name="keywords" content={keywords} />}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
        <ArrowLeft size={16} /> Quay lại Blog
      </Link>

      {/* 2:1 split — sidebar (Mục lục + bài liên quan + Facebook) on the left, article on the
          right. Sidebar stacks below the article on mobile (there's no room for 3 real columns
          or independent scroll panes on a small screen) — on desktop each column is its own
          fixed-height scroll container instead of tracking the page's own scroll. */}
      <div className="mt-4 grid gap-6 lg:h-[calc(100vh-11rem)] lg:grid-cols-3 lg:items-stretch">
        <aside className="order-2 lg:order-1 lg:col-span-1 lg:h-full lg:min-h-0 lg:overflow-x-hidden lg:overflow-y-auto lg:pr-1 vibe-scrollbar">
          <div className="space-y-4">
            {showToc && (
              <nav aria-label="Mục lục" className="rounded-2xl border-2 border-vibe-ink/10 bg-white/70 p-4">
                <p className="mb-2.5 flex items-center gap-1.5 font-display text-sm font-semibold text-vibe-ink">
                  <List size={16} /> Mục lục
                </p>
                <ol className="space-y-1.5 text-sm">
                  {tocEntries.map((h) => (
                    <li key={h.id} className={h.level === 3 ? 'ml-4' : undefined}>
                      <a href={`#${h.id}`} className="text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark hover:underline">
                        {h.text}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            )}

            {related.length > 0 && (
              <div className="rounded-2xl bg-vibe-highlight/60 p-4">
                <p className="mb-3 font-display text-sm font-semibold text-vibe-ink">Bài viết liên quan</p>
                <div className="space-y-2.5">
                  {related.map((r) => (
                    <Link key={r.slug} to={`/blog/${r.slug}`} className="flex items-center gap-2.5 rounded-xl bg-white/70 p-2.5 shadow-sm transition-shadow hover:shadow-vibe">
                      <CoverMedia post={r} className="h-10 w-10 shrink-0 overflow-hidden rounded-lg" compact />
                      <p className="line-clamp-2 text-xs font-semibold text-vibe-ink">{r.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <FacebookPageCard />
          </div>
        </aside>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="order-1 rounded-[2rem] bg-vibe-highlight/95 p-6 shadow-vibe backdrop-blur-sm sm:p-10 lg:order-2 lg:col-span-2 lg:h-full lg:min-h-0 lg:overflow-y-auto vibe-scrollbar"
        >
          <span className="inline-block text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
            {labelFor(post.category)}
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-sm text-vibe-ink-soft">
            {new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {post.readMinutes} phút đọc
          </p>

          {/* Sapo: "đoạn mở đầu dẫn dắt người đọc đến nội dung chính" per the writing template —
              this is meant to be read on the article page itself, not just used as the listing
              page's preview blurb (which is all it did before). */}
          {post.excerpt && (
            <p className="mt-5 font-display text-lg leading-relaxed text-vibe-ink">{post.excerpt}</p>
          )}

          <CoverMedia post={post} className="mt-8 aspect-[21/9] overflow-hidden rounded-[2rem] shadow-vibe" priority />
          {post.cover?.alt && (
            <p className="mt-1.5 text-center text-xs text-vibe-ink-soft/70">{post.cover.alt}</p>
          )}
          {post.cover?.credit && (
            <p className="mt-1 text-right text-[11px] text-vibe-ink-soft/60">
              Ảnh:{' '}
              {post.cover.sourceUrl ? (
                <a href={post.cover.sourceUrl} target="_blank" rel="noreferrer" className="underline hover:text-vibe-ink-soft">
                  {post.cover.credit}
                </a>
              ) : (
                post.cover.credit
              )}
            </p>
          )}

          {usesRichContent ? (
            <RichContent html={post.contentHtml} onHeadings={setHtmlHeadings} />
          ) : (
            <div className={RICH_CONTENT_CLASSES}>
              {post.contentBlocks.length > 0
                ? post.contentBlocks.map((block, i) => {
                    if (block.type === 'heading2') {
                      return (
                        <h2 key={i} id={headingIds.get(i)?.id} className="!mt-10 scroll-mt-24 font-display text-xl font-semibold text-vibe-ink">
                          {block.text}
                        </h2>
                      )
                    }
                    if (block.type === 'heading3') {
                      return (
                        <h3 key={i} id={headingIds.get(i)?.id} className="!mt-6 scroll-mt-24 font-display text-base font-semibold text-vibe-ink">
                          {block.text}
                        </h3>
                      )
                    }
                    if (block.type === 'image') {
                      if (!block.src) return null
                      return (
                        <figure key={i} className="!my-6">
                          <img
                            src={block.src}
                            alt={block.alt}
                            loading="lazy"
                            decoding="async"
                            className="w-full rounded-2xl object-cover"
                          />
                          {block.caption && <figcaption className="mt-2 text-center text-xs text-vibe-ink-soft">{block.caption}</figcaption>}
                        </figure>
                      )
                    }
                    if (block.type === 'table') {
                      if (!block.html.trim()) return null
                      return <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.html) }} />
                    }
                    // paragraph — text is sanitized inline-rich HTML from RichBlockEditor.tsx
                    // (or a legacy plain string, which renders identically either way).
                    return <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(block.text) }} />
                  })
                : // Posts saved before content_blocks existed (or before the DB backfill has run) —
                  // same plain-paragraph rendering this page always used, so nothing regresses.
                  post.content.map((p, i) => <p key={i}>{p}</p>)}
            </div>
          )}

          {/* CTA cuối bài — editable per post from admin (title/button label/button url), so a
              Studio-focused post can point at /studio while another points elsewhere. */}
          {post.ctaEnabled && (
            <div className="mt-10 rounded-2xl bg-[linear-gradient(100deg,#7fa8e022,#ff92f922_55%,#ffd87922)] p-6 text-center">
              <p className="font-display text-lg font-semibold text-vibe-ink">{post.ctaTitle}</p>
              <Button
                className="mt-4"
                onClick={() => {
                  if (post.ctaButtonUrl.startsWith('/')) navigate(post.ctaButtonUrl)
                  else window.open(post.ctaButtonUrl, '_blank', 'noreferrer')
                }}
              >
                {post.ctaButtonLabel} <ArrowRight size={18} />
              </Button>
            </div>
          )}

          {/* Credit/signature line the writing template asks every post to close with
              ("Bài viết và hình ảnh được thực hiện bởi [doanh nghiệp]" + a signature) — editable
              per post from the admin editor (post.creditLine), right-aligned per request. */}
          <div className="mt-10 border-t border-vibe-ink/10 pt-6 text-right">
            <p className="text-xs text-vibe-ink-soft">{post.creditLine}</p>
            <div className="ml-auto mt-3 h-px w-16 bg-vibe-ink/10" />
            <Logo className="ml-auto mt-3 justify-end" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}
