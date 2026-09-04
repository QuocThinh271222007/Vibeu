import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Sparkles, Trash2 } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Avatar } from '@/components/ui/Avatar'
import { NewPostComposer } from '@/components/community/NewPostComposer'
import { COMMUNITY_POSTS } from '@/data/community'
import { findTemplate } from '@/data/templates'
import { fingersFromTemplate } from '@/lib/templateUtils'
import { deleteCommunityPost, fetchCommunityPosts, setCommunityLike, type RemoteCommunityPost } from '@/lib/communityApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'

interface FeedItem {
  id: string
  isRemote: boolean
  templateId: string | null
  userName: string
  handle: string
  avatarInitial: string
  avatarColor: string
  avatarUrl: string | null
  timeAgo: string
  caption: string
  hashtags: string[]
  likes: number
  comments: number
  media: { src: string; alt: string; objectPosition?: string } | null
  likedByMe: boolean
  authorId: string | null
}

function remoteToFeedItem(p: RemoteCommunityPost): FeedItem {
  return {
    id: p.id,
    isRemote: true,
    templateId: p.templateId,
    userName: p.userName,
    handle: p.handle,
    avatarInitial: p.avatarInitial,
    avatarColor: p.avatarColor,
    avatarUrl: p.avatarUrl,
    timeAgo: p.timeAgo,
    caption: p.caption,
    hashtags: p.hashtags,
    likes: p.likes,
    comments: p.comments,
    media: p.media,
    likedByMe: p.likedByMe,
    authorId: p.authorId,
  }
}

function staticToFeedItem(p: (typeof COMMUNITY_POSTS)[number]): FeedItem {
  return {
    id: p.id,
    isRemote: false,
    templateId: p.templateId,
    userName: p.userName,
    handle: p.handle,
    avatarInitial: p.avatarInitial,
    avatarColor: p.avatarColor,
    avatarUrl: null,
    timeAgo: p.timeAgo,
    caption: p.caption,
    hashtags: p.hashtags,
    likes: p.likes,
    comments: p.comments,
    media: p.media ? { src: p.media.src, alt: p.media.alt, objectPosition: p.media.objectPosition } : null,
    likedByMe: false,
    authorId: null,
  }
}

export default function Community() {
  const { status, profile } = useAuthStore()
  const [remotePosts, setRemotePosts] = useState<FeedItem[]>([])

  const reload = useCallback(() => {
    if (!isSupabaseConfigured) return
    fetchCommunityPosts(profile?.id ?? null).then((posts) => setRemotePosts(posts.map(remoteToFeedItem)))
  }, [profile?.id])

  useEffect(() => {
    reload()
  }, [reload])

  const feed = [...remotePosts, ...COMMUNITY_POSTS.map(staticToFeedItem)]

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Cộng đồng
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Vibe hôm nay của mọi người</h1>
        <p className="mx-auto mt-3 max-w-md text-vibe-ink-soft">Khoe bộ nail vừa thiết kế, xin vía và truyền cảm hứng cho cộng đồng VIBEU.</p>
      </div>

      <div className="mt-10">
        {status === 'signedIn' && profile ? (
          <NewPostComposer profile={profile} onCreated={reload} />
        ) : (
          <Link
            to="/auth?redirect=/community"
            className="mb-6 flex items-center gap-3 rounded-[1.75rem] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] transition-shadow hover:shadow-vibe"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vibe-pink/10 text-vibe-pink-dark">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-medium text-vibe-ink">
              <span className="font-semibold text-vibe-pink-dark">Đăng nhập</span> để chia sẻ bộ nail bạn vừa thiết kế với cộng đồng VIBEU
            </span>
          </Link>
        )}

        <div className="space-y-6">
          {feed.map((post, i) => (
            <PostCard key={post.id} post={post} index={i} currentUserId={profile?.id ?? null} isAdmin={profile?.role === 'admin'} onChanged={reload} />
          ))}
        </div>
      </div>
    </div>
  )
}

function PostCard({
  post,
  index,
  currentUserId,
  isAdmin,
  onChanged,
}: {
  post: FeedItem
  index: number
  currentUserId: string | null
  isAdmin: boolean
  onChanged: () => void
}) {
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [cardError, setLikeError] = useState<string | null>(null)
  const template = post.templateId ? findTemplate(post.templateId) : undefined

  async function toggleLike() {
    const next = !liked
    setLiked(next)
    setLikeCount((c) => (next ? c + 1 : c - 1))
    setLikeError(null)
    if (post.isRemote && currentUserId) {
      const { error } = await setCommunityLike(post.id, currentUserId, next)
      if (error) {
        setLiked(!next)
        setLikeCount((c) => (next ? c - 1 : c + 1))
        setLikeError(error)
      }
    }
  }

  async function handleDelete() {
    if (!confirm('Xoá bài đăng này?')) return
    const { error } = await deleteCommunityPost(post.id)
    if (error) {
      setLikeError(error)
      return
    }
    onChanged()
  }

  const canDelete = post.isRemote && (isAdmin || (currentUserId && post.authorId === currentUserId))

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 5) * 0.05 }}
      className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]"
    >
      <div className="flex items-center gap-3 p-4">
        <Avatar name={post.avatarInitial} color={post.avatarColor} url={post.avatarUrl} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-vibe-ink">{post.userName}</p>
          <p className="truncate text-xs text-vibe-ink-soft">{post.handle} · {post.timeAgo}</p>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="shrink-0 text-vibe-ink-soft/60 transition-colors hover:text-red-500" aria-label="Xoá bài đăng">
            <Trash2 size={16} />
          </button>
        )}
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
        ) : template ? (
          <>
            {/* No submitted photo yet — shown as a live design preview, not disguised as a
                real photo, per the media model's fallback rule. */}
            <HandCanvas skinTone={template.skinTone} fingers={fingersFromTemplate(template)} className="rounded-2xl" />
            <span className="pointer-events-none absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
              Xem trước thiết kế (chưa có ảnh thật)
            </span>
          </>
        ) : null}
      </div>

      <div className="p-4">
        <p className="text-sm leading-relaxed text-vibe-ink">{post.caption}</p>
        {post.hashtags.length > 0 && <p className="mt-1.5 text-xs font-medium text-vibe-blue-dark">{post.hashtags.join('  ')}</p>}
        {cardError && <p className="mt-1.5 text-xs text-red-600">{cardError}</p>}

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
