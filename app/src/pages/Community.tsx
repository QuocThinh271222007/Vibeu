import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2 } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { COMMUNITY_POSTS } from '@/data/community'
import { findTemplate } from '@/data/templates'
import { fingersFromTemplate } from '@/lib/templateUtils'

export default function Community() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Cộng đồng
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Vibe hôm nay của mọi người</h1>
        <p className="mx-auto mt-3 max-w-md text-vibe-ink-soft">Khoe bộ nail vừa thiết kế, xin vía và truyền cảm hứng cho cộng đồng VIBEU.</p>
      </div>

      <div className="mt-10 space-y-6">
        {COMMUNITY_POSTS.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} />
        ))}
      </div>
    </div>
  )
}

function PostCard({ post, index }: { post: (typeof COMMUNITY_POSTS)[number]; index: number }) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const template = findTemplate(post.templateId)
  if (!template) return null

  function toggleLike() {
    setLiked((l) => !l)
    setLikeCount((c) => (liked ? c - 1 : c + 1))
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 5) * 0.05 }}
      className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
    >
      <div className="flex items-center gap-3 p-4">
        <span
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full font-display text-sm font-bold text-white"
          style={{ background: post.avatarColor }}
        >
          {post.avatarInitial}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-vibe-ink">{post.userName}</p>
          <p className="truncate text-xs text-vibe-ink-soft">{post.handle} · {post.timeAgo}</p>
        </div>
      </div>

      <div className="relative mx-4 overflow-hidden rounded-2xl">
        {post.media ? (
          <img
            src={post.media.src}
            alt={post.media.alt}
            className="aspect-[4/5] w-full object-cover"
            style={{ objectPosition: post.media.objectPosition ?? 'center center' }}
            loading="lazy"
          />
        ) : (
          <>
            {/* No submitted photo on this (fictional demo) post — shown as a live design
                preview, not disguised as a real photo, per the media model's fallback rule. */}
            <HandCanvas skinTone={template.skinTone} fingers={fingersFromTemplate(template)} className="rounded-2xl" />
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              Xem trước thiết kế (chưa có ảnh thật)
            </span>
          </>
        )}
      </div>

      <div className="p-4">
        <p className="text-sm leading-relaxed text-vibe-ink">{post.caption}</p>
        <p className="mt-1.5 text-xs font-medium text-vibe-blue-dark">{post.hashtags.join('  ')}</p>

        <div className="mt-4 flex items-center gap-5 border-t border-vibe-ink/5 pt-3">
          <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
            <Heart size={18} className={liked ? 'fill-vibe-pink-dark text-vibe-pink-dark' : ''} /> {likeCount}
          </button>
          <span className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft">
            <MessageCircle size={18} /> {post.comments}
          </span>
          <button className="ml-auto text-vibe-ink-soft transition-colors hover:text-vibe-ink">
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
