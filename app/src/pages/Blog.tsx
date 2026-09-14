import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Chip } from '@/components/ui/Chip'
import { MediaPlaceholder } from '@/components/ui/MediaPlaceholder'
import type { BlogPost } from '@/data/blog'
import { useBlogPosts } from '@/hooks/useBlogPosts'
import { useBlogCategories } from '@/hooks/useBlogCategories'
import { useBlogSeries } from '@/hooks/useBlogSeries'
import { PageMeta } from '@/components/seo/PageMeta'

function BlogCoverMedia({ post, className, compact = false, priority = false }: { post: BlogPost; className: string; compact?: boolean; priority?: boolean }) {
  return (
    <div className={className} style={{ background: post.cover ? undefined : `${post.accentColor}22` }}>
      {post.cover ? (
        <img
          src={post.cover.src}
          alt={post.cover.alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: post.cover.objectPosition ?? 'center center' }}
          // The featured post's cover is this page's likely LCP element.
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : undefined}
        />
      ) : (
        <MediaPlaceholder className="h-full w-full" compact={compact} />
      )}
    </div>
  )
}

export default function Blog() {
  const [cat, setCat] = useState<string | 'all'>('all')
  const [seriesFilter, setSeriesFilter] = useState<string | 'all'>('all')
  const { posts } = useBlogPosts()
  const { categories, labelFor } = useBlogCategories()
  const { series } = useBlogSeries()

  const filtered = useMemo(
    () =>
      posts
        .filter((p) => cat === 'all' || p.category === cat)
        .filter((p) => seriesFilter === 'all' || p.seriesId === seriesFilter),
    [cat, seriesFilter, posts],
  )
  const [featured, ...rest] = filtered

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <PageMeta
        title="Blog"
        description="Mẹo làm đẹp, trend móng mới và hướng dẫn dưỡng nail từ đội ngũ VIBEU."
        canonicalPath="/blog"
      />
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Blog
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Mẹo đẹp & cảm hứng làm nail</h1>
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-2">
        <Chip active={cat === 'all'} onClick={() => setCat('all')}>
          Tất cả
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={cat === c.slug} onClick={() => setCat(c.slug)}>
            {c.name}
          </Chip>
        ))}
      </div>

      {series.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs font-semibold text-vibe-ink-soft">Mục lục:</span>
          <Chip active={seriesFilter === 'all'} onClick={() => setSeriesFilter('all')}>
            Tất cả
          </Chip>
          {series.map((s) => (
            <Chip key={s.id} active={seriesFilter === s.id} onClick={() => setSeriesFilter(s.id)}>
              {s.name}
            </Chip>
          ))}
        </div>
      )}

      {!featured ? (
        <p className="py-20 text-center text-vibe-ink-soft">Chưa có bài viết trong danh mục này.</p>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-10">
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-[2rem] bg-vibe-highlight shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:grid-cols-2"
            >
              <BlogCoverMedia post={featured} className="aspect-video overflow-hidden sm:aspect-auto" priority />
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <span className="text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">{labelFor(featured.category)}</span>
                <h2 className="mt-2 font-display text-2xl font-semibold text-vibe-ink transition-colors group-hover:text-vibe-pink-dark">{featured.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-vibe-ink-soft">{featured.excerpt}</p>
                <p className="mt-4 text-xs text-vibe-ink-soft">{formatDate(featured.date)} · {featured.readMinutes} phút đọc</p>
              </div>
            </Link>
          </motion.div>

          <div className="mt-10 space-y-3">
            {rest.map((p, i) => (
              <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Link to={`/blog/${p.slug}`} className="group flex items-center gap-4 rounded-2xl bg-vibe-highlight p-3.5 shadow-sm transition-shadow hover:shadow-vibe">
                  <BlogCoverMedia post={p} className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" compact />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-vibe-ink group-hover:text-vibe-pink-dark">{p.title}</p>
                    <p className="mt-1 text-xs text-vibe-ink-soft">{labelFor(p.category)} · {formatDate(p.date)}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
