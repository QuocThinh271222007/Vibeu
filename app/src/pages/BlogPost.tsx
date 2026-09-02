import { Link, useParams, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'
import { BLOG_CATEGORY_LABEL, findBlogPost, relatedPosts, type BlogPost as BlogPostType } from '@/data/blog'

function CoverMedia({ post, className, compact = false }: { post: BlogPostType; className: string; compact?: boolean }) {
  return (
    <div className={className} style={{ background: post.cover ? undefined : `${post.accentColor}22` }}>
      {post.cover ? (
        <img
          src={post.cover.src}
          alt={post.cover.alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: post.cover.objectPosition ?? 'center center' }}
          loading="lazy"
        />
      ) : (
        <MediaPlaceholder className="h-full w-full" compact={compact} />
      )}
    </div>
  )
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>()
  const post = slug ? findBlogPost(slug) : undefined

  if (!post) return <Navigate to="/blog" replace />

  const related = relatedPosts(post.slug)

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm font-semibold text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
        <ArrowLeft size={16} /> Quay lại Blog
      </Link>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <CoverMedia post={post} className="mt-6 aspect-[21/9] overflow-hidden rounded-[2rem] shadow-vibe" />
        {post.cover?.credit && (
          <p className="mt-1.5 text-right text-[11px] text-vibe-ink-soft/60">
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

        <span className="mt-6 inline-block text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          {BLOG_CATEGORY_LABEL[post.category]}
        </span>
        <h1 className="mt-2 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-sm text-vibe-ink-soft">
          {new Date(post.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} · {post.readMinutes} phút đọc
        </p>

        <div className="mt-8 space-y-4 text-[15px] leading-relaxed text-vibe-ink/90">
          {post.content.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </motion.div>

      {related.length > 0 && (
        <div className="mt-14 border-t border-vibe-ink/10 pt-8">
          <p className="mb-4 font-display text-sm font-semibold text-vibe-ink">Bài viết liên quan</p>
          <div className="grid gap-3 sm:grid-cols-3">
            {related.map((r) => (
              <Link key={r.slug} to={`/blog/${r.slug}`} className="rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-vibe">
                <CoverMedia post={r} className="h-12 w-12 overflow-hidden rounded-xl" compact />
                <p className="mt-2.5 line-clamp-2 text-sm font-semibold text-vibe-ink">{r.title}</p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
