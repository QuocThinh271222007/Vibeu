import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, List } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'
import { FacebookGlyph } from '@/components/ui/SocialGlyphs'
import { BlogShareButtons } from '@/components/blog/BlogShareButtons'
import NotFound from '@/pages/NotFound'
import { findBlogPost, relatedPosts, type ContentBlock, type BlogPost as BlogPostType } from '@/data/blog'
import { useBlogPosts } from '@/hooks/useBlogPosts'
import { useBlogCategories } from '@/hooks/useBlogCategories'
import { PageMeta } from '@/components/seo/PageMeta'
import { sanitizeBlogHtml } from '@/lib/blogContentHtml'
import { slugify } from '@/lib/slug'

interface HeadingId {
  id: string
  level: 2 | 3
  text: string
}

const RICH_CONTENT_CLASSES =
  'mt-8 space-y-4 text-[15px] leading-relaxed text-vibe-ink/90 ' +
  '[&_h2]:!mt-10 [&_h2]:scroll-mt-24 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-vibe-ink ' +
  '[&_h3]:!mt-6 [&_h3]:scroll-mt-24 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-vibe-ink ' +
  '[&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_li_p]:mt-0 [&_ul_ul]:list-[circle] [&_li>ul]:mt-1 [&_li>ol]:mt-1 ' +
  '[&_blockquote]:mt-4 [&_blockquote]:border-l-4 [&_blockquote]:border-vibe-pink/30 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote>p:first-child]:mt-0 ' +
  '[&_pre]:mt-4 [&_pre]:overflow-x-auto [&_pre]:rounded-xl [&_pre]:bg-vibe-ink [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-[13px] [&_pre]:leading-relaxed [&_pre]:text-white [&_pre_code]:bg-transparent ' +
  '[&_p_code]:rounded [&_p_code]:bg-vibe-cream [&_p_code]:px-1 [&_p_code]:font-mono [&_p_code]:text-[13px] ' +
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

/** One specific Facebook post (set per blog post from the admin editor), embedded via Facebook's
 * iframe Post Plugin — no app id/SDK needed. Switched away from embedding the whole Facebook Page
 * (Page Plugin): that one's adaptive-resize/lazy-load behavior proved unreliable inside a sidebar
 * card, sometimes leaving it stuck on a loading spinner. A single post has much less going on
 * (no timeline pagination, no adaptive-width JS handshake) and embeds far more predictably. */
function FacebookPostCard({ url }: { url: string }) {
  const href = encodeURIComponent(url)
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-vibe-ink/10 bg-white/70 p-4">
      <p className="mb-3 flex items-center gap-1.5 font-display text-sm font-semibold text-vibe-ink">
        <FacebookGlyph size={16} className="text-vibe-blue-dark" /> VIBEU trên Facebook
      </p>
      <iframe
        title="Bài viết Facebook của VIBEU"
        src={`https://www.facebook.com/plugins/post.php?href=${href}&show_text=true&width=340`}
        width="340"
        height={420}
        style={{ border: 'none', display: 'block', width: '100%', maxWidth: '340px', overflow: 'hidden', borderRadius: '0.75rem', colorScheme: 'light' }}
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
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  // All of these read from `post` with a safe fallback (rather than after the early-return
  // below) purely so the scrollspy effect — which depends on them — can stay an unconditional
  // hook call, same reason htmlHeadings/activeHeadingId are declared up here too.
  const usesRichContent = post ? post.contentHtml.trim().length > 0 : false
  const headingIds = post ? buildHeadingIds(post.contentBlocks) : new Map<number, HeadingId>()
  const tocEntries = usesRichContent ? htmlHeadings : Array.from(headingIds.values())
  const showToc = post ? post.showToc && tocEntries.length >= 2 : false
  const tocIdsKey = tocEntries.map((h) => h.id).join('|')

  // Scrollspy: highlight whichever Mục lục entry the reader is currently under — the last
  // heading that's scrolled up past the sticky header, not just whichever is nearest the top of
  // the viewport, so the highlight matches "which section am I reading" all the way until the
  // next heading actually arrives. Depends on tocIdsKey (not tocEntries itself, a fresh array
  // every render) so it only re-attaches once the actual set of headings changes — for the
  // WYSIWYG-HTML path that's after RichContent's own effect has assigned real ids to the DOM.
  useEffect(() => {
    if (!showToc) return
    const headingEls = tocEntries
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headingEls.length === 0) return

    // Matches the scroll-mt-24 offset used on every heading (keeps the "active" switch lined up
    // with where the heading actually settles under the sticky site header).
    const OFFSET = 110

    function updateActive() {
      let current = headingEls[0].id
      for (const el of headingEls) {
        if (el.getBoundingClientRect().top - OFFSET <= 0) current = el.id
        else break
      }
      setActiveHeadingId(current)
    }

    updateActive()
    window.addEventListener('scroll', updateActive, { passive: true })
    return () => window.removeEventListener('scroll', updateActive)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showToc, tocIdsKey])

  if (!post) {
    if (loading) return null
    // An unknown slug used to silently redirect to /blog — indistinguishable from a real page to
    // both users and crawlers (a classic soft-404: HTTP 200, generic content, no signal that the
    // requested thing doesn't exist). Rendering NotFound directly gives it a noindex instead.
    return <NotFound />
  }

  const related = relatedPosts(post.slug, posts)
  const keywords = [post.primaryKeyword, post.secondaryKeyword].filter(Boolean).join(', ')
  const postUrl = `https://vibeu.design/blog/${post.slug}`
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription || post.excerpt,
    image: post.cover?.src,
    datePublished: post.date,
    dateModified: post.updatedAt ? post.updatedAt.slice(0, 10) : post.date,
    author: { '@type': 'Organization', name: 'VIBEU' },
    publisher: { '@type': 'Organization', name: 'VIBEU', logo: { '@type': 'ImageObject', url: 'https://vibeu.design/assets/brand/logo-mark.png' } },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl },
  }
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: 'https://vibeu.design/' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://vibeu.design/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: postUrl },
    ],
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <PageMeta
        title={post.title}
        description={post.metaDescription || post.excerpt}
        canonicalPath={`/blog/${post.slug}`}
        image={post.cover?.src}
        type="article"
      />
      {keywords && <meta name="keywords" content={keywords} />}
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(breadcrumbJsonLd)}</script>

      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
        <ArrowLeft size={16} /> Quay lại Blog
      </Link>

      {/* 2:1 split — sidebar (Mục lục + bài liên quan + Facebook) on the left, article on the
          right. Sidebar stacks below the article on mobile (there's no room for 3 real columns),
          and stays pinned (lg:sticky) while the much taller article column scrolls past it. */}
      <div className="mt-4 grid gap-6 lg:grid-cols-3">
        <aside className="order-2 lg:order-1 lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-24">
            {showToc && (
              <nav aria-label="Mục lục" className="rounded-2xl border-2 border-vibe-ink/10 bg-white/70 p-4">
                <p className="mb-2.5 flex items-center gap-1.5 font-display text-sm font-semibold text-vibe-ink">
                  <List size={16} /> Mục lục
                </p>
                <ol className="space-y-1.5 text-sm">
                  {tocEntries.map((h) => (
                    <li key={h.id} className={h.level === 3 ? 'ml-4' : undefined}>
                      <a
                        href={`#${h.id}`}
                        className={`block border-l-2 pl-2.5 -ml-px transition-colors hover:text-vibe-pink-dark hover:underline ${
                          h.id === activeHeadingId
                            ? 'border-vibe-pink-dark font-semibold text-vibe-pink-dark'
                            : 'border-transparent text-vibe-ink-soft'
                        }`}
                      >
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

            {post.facebookPostUrl && <FacebookPostCard url={post.facebookPostUrl} />}
          </div>
        </aside>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="order-1 rounded-[2rem] bg-vibe-highlight/95 p-6 shadow-vibe backdrop-blur-sm sm:p-10 lg:order-2 lg:col-span-2"
        >
          {/* Visible trail matching breadcrumbJsonLd above — schema without matching on-page
              content is the kind of thing Google's structured-data guidelines explicitly warn
              against. */}
          <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-vibe-ink-soft">
            <Link to="/" className="hover:text-vibe-pink-dark hover:underline">Trang chủ</Link>
            <span aria-hidden="true">/</span>
            <Link to="/blog" className="hover:text-vibe-pink-dark hover:underline">Blog</Link>
            <span aria-hidden="true">/</span>
            <span className="truncate text-vibe-ink-soft/70">{post.title}</span>
          </nav>
          <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
            {labelFor(post.category)}
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">{post.title}</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-vibe-ink-soft">
              {new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {post.readMinutes} phút đọc
            </p>
            <BlogShareButtons url={postUrl} title={post.title} />
          </div>

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
                        <h2
                          key={i}
                          id={headingIds.get(i)?.id}
                          style={block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined}
                          className="!mt-10 scroll-mt-24 font-display text-xl font-semibold text-vibe-ink"
                        >
                          {block.text}
                        </h2>
                      )
                    }
                    if (block.type === 'heading3') {
                      return (
                        <h3
                          key={i}
                          id={headingIds.get(i)?.id}
                          style={block.fontSize ? { fontSize: `${block.fontSize}px` } : undefined}
                          className="!mt-6 scroll-mt-24 font-display text-base font-semibold text-vibe-ink"
                        >
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
