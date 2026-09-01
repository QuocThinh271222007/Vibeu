import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Chip } from '@/components/ui/Chip'
import { BLOG_CATEGORY_LABEL, BLOG_POSTS, type BlogCategory } from '@/data/blog'

const CATS: (BlogCategory | 'all')[] = ['all', 'tips', 'trend', 'care']

export default function Blog() {
  const [cat, setCat] = useState<BlogCategory | 'all'>('all')

  const filtered = useMemo(() => (cat === 'all' ? BLOG_POSTS : BLOG_POSTS.filter((p) => p.category === cat)), [cat])
  const [featured, ...rest] = filtered

  return (
    <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Blog
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Mẹo đẹp & cảm hứng làm nail</h1>
      </div>

      <div className="mt-8 flex justify-center gap-2">
        {CATS.map((c) => (
          <Chip key={c} active={cat === c} onClick={() => setCat(c)}>
            {c === 'all' ? 'Tất cả' : BLOG_CATEGORY_LABEL[c]}
          </Chip>
        ))}
      </div>

      {!featured ? (
        <p className="py-20 text-center text-vibe-ink-soft">Chưa có bài viết trong danh mục này.</p>
      ) : (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-10">
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-[2rem] bg-white shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:grid-cols-2"
            >
              <div className="grid aspect-video place-items-center text-6xl sm:aspect-auto" style={{ background: featured.gradient }}>
                <span className="drop-shadow-sm">{featured.emoji}</span>
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-9">
                <span className="text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">{BLOG_CATEGORY_LABEL[featured.category]}</span>
                <h2 className="mt-2 font-display text-2xl font-semibold text-vibe-ink transition-colors group-hover:text-vibe-pink-dark">{featured.title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-vibe-ink-soft">{featured.excerpt}</p>
                <p className="mt-4 text-xs text-vibe-ink-soft">{formatDate(featured.date)} · {featured.readMinutes} phút đọc</p>
              </div>
            </Link>
          </motion.div>

          <div className="mt-10 space-y-3">
            {rest.map((p, i) => (
              <motion.div key={p.slug} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.05 }}>
                <Link to={`/blog/${p.slug}`} className="group flex items-center gap-4 rounded-2xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-vibe">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl text-2xl" style={{ background: p.gradient }}>
                    {p.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-vibe-ink group-hover:text-vibe-pink-dark">{p.title}</p>
                    <p className="mt-1 text-xs text-vibe-ink-soft">{BLOG_CATEGORY_LABEL[p.category]} · {formatDate(p.date)}</p>
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
