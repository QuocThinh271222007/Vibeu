import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'
import { BLOG_CATEGORY_LABEL, findBlogPost, relatedPosts, type BlogPost as BlogPostType } from '@/data/blog'
import { useBlogPosts } from '@/hooks/useBlogPosts'
import { PageMeta } from '@/components/seo/PageMeta'

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

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const { posts, loading } = useBlogPosts()
  const post = slug ? findBlogPost(slug, posts) : undefined

  if (!post) {
    if (loading) return null
    return <Navigate to="/blog" replace />
  }

  const related = relatedPosts(post.slug, posts)
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
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
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

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          {BLOG_CATEGORY_LABEL[post.category]}
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

        {/* Bài viết liên quan: the writing template lists this right after the Sapo, before
            the body content — not as a "see also" appendix at the end of the page. */}
        {related.length > 0 && (
          <div className="mt-8 rounded-2xl bg-vibe-highlight/60 p-4">
            <p className="mb-3 font-display text-sm font-semibold text-vibe-ink">Bài viết liên quan</p>
            <div className="grid gap-3 sm:grid-cols-3">
              {related.map((r) => (
                <Link key={r.slug} to={`/blog/${r.slug}`} className="flex items-center gap-2.5 rounded-xl bg-white/70 p-2.5 shadow-sm transition-shadow hover:shadow-vibe">
                  <CoverMedia post={r} className="h-10 w-10 shrink-0 overflow-hidden rounded-lg" compact />
                  <p className="line-clamp-2 text-xs font-semibold text-vibe-ink">{r.title}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ORDER OVERRIDE (2026-09-11, explicit client directive): Template bai SEO.docx lists
            the featured image + caption AFTER Sapo/Bai viet lien quan, not before the title —
            the opposite of standard blog convention (cover image first, above the fold, before
            any text). Both we and the client agree the conventional order reads better, but the
            client wants the docx's literal order followed regardless, so this block was moved
            down here from right after the opening <motion.div> (where it originally sat, first,
            before the category/title/date group above).
            TO REVERT: move this whole block (through the closing </div> before "mt-8
            space-y-4") back up to immediately after <motion.div ...>, above the category span. */}
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

        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-vibe-ink/90">
          {post.contentBlocks.length > 0
            ? post.contentBlocks.map((block, i) => {
                if (block.type === 'heading2') {
                  return (
                    <h2 key={i} className="!mt-10 font-display text-xl font-semibold text-vibe-ink">
                      {block.text}
                    </h2>
                  )
                }
                if (block.type === 'heading3') {
                  return (
                    <h3 key={i} className="!mt-6 font-display text-base font-semibold text-vibe-ink">
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
                return <p key={i}>{block.text}</p>
              })
            : // Posts saved before content_blocks existed (or before the DB backfill has run) —
              // same plain-paragraph rendering this page always used, so nothing regresses.
              post.content.map((p, i) => <p key={i}>{p}</p>)}
        </div>

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
  )
}
