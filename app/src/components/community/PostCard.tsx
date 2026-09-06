import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Trash2 } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import { COMMUNITY_POSTS } from '@/data/community'
import { findTemplate } from '@/data/templates'
import { fingersFromTemplate } from '@/lib/templateUtils'
import { deleteCommunityPost, setCommunityLike, type RemoteCommunityPost } from '@/lib/communityApi'

export interface FeedItem {
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
  approved: boolean
}

export function remoteToFeedItem(p: RemoteCommunityPost): FeedItem {
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
    approved: p.approved,
  }
}

export function staticToFeedItem(p: (typeof COMMUNITY_POSTS)[number]): FeedItem {
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
    approved: true,
  }
}

export function PostCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)]">
      <div className="flex items-center gap-3 p-4">
        <div className="h-10 w-10 shrink-0 rounded-full bg-vibe-cream" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 w-28 rounded-full bg-vibe-cream" />
          <div className="h-2.5 w-20 rounded-full bg-vibe-cream" />
        </div>
      </div>
      <div className="mx-4 aspect-[4/5] rounded-2xl bg-vibe-cream" />
      <div className="space-y-2 p-4">
        <div className="h-3 w-full rounded-full bg-vibe-cream" />
        <div className="h-3 w-2/3 rounded-full bg-vibe-cream" />
      </div>
    </div>
  )
}

/** One post card — used on the feed (/community), a user's profile grid isn't this component
 * (it needs a denser thumbnail grid instead), and the detail page (/community/:id) via the
 * `linkToDetail` prop toggling whether the caption area is itself a link to that page. */
export function PostCard({
  post,
  index = 0,
  currentUserId,
  isAdmin,
  highlighted = false,
  linkToDetail = true,
  onChanged,
}: {
  post: FeedItem
  index?: number
  currentUserId: string | null
  isAdmin: boolean
  highlighted?: boolean
  linkToDetail?: boolean
  onChanged: () => void
}) {
  const { push } = useToast()
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [cardError, setLikeError] = useState<string | null>(null)
  const template = post.templateId ? findTemplate(post.templateId) : undefined

  async function handleShare() {
    const shareData = { title: `${post.userName} trên VIBEU`, text: post.caption, url: `${window.location.origin}/community/${post.id}` }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // User cancelled the native share sheet — not an error worth surfacing.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(shareData.url)
      push('success', 'Đã sao chép liên kết bài đăng.')
    } catch {
      push('error', 'Không sao chép được liên kết.')
    }
  }

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

  const media = (
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
  )

  return (
    <motion.article
      id={`post-${post.id}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.45, delay: (index % 5) * 0.05 }}
      className={`overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] transition-shadow ${
        highlighted ? 'ring-2 ring-vibe-pink-dark' : ''
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        <Link to={post.authorId ? `/u/${post.authorId}` : '#'} className={`shrink-0 ${!post.authorId ? 'pointer-events-none' : ''}`}>
          <Avatar name={post.avatarInitial} color={post.avatarColor} url={post.avatarUrl} size={40} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            to={post.authorId ? `/u/${post.authorId}` : '#'}
            className={`flex items-center gap-1.5 truncate text-sm font-semibold text-vibe-ink ${!post.authorId ? 'pointer-events-none' : 'hover:underline'}`}
          >
            <span className="truncate">{post.userName}</span>
            {!post.approved && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Chờ duyệt, chỉ bạn thấy
              </span>
            )}
          </Link>
          <p className="truncate text-xs text-vibe-ink-soft">{post.handle} · {post.timeAgo}</p>
        </div>
        {canDelete && (
          <button onClick={handleDelete} className="shrink-0 text-vibe-ink-soft/60 transition-colors hover:text-red-500" aria-label="Xoá bài đăng">
            <Trash2 size={16} />
          </button>
        )}
      </div>

      {linkToDetail ? <Link to={`/community/${post.id}`}>{media}</Link> : media}

      <div className="p-4">
        <p className="text-sm leading-relaxed text-vibe-ink">{post.caption}</p>
        {post.hashtags.length > 0 && <p className="mt-1.5 text-xs font-medium text-vibe-blue-dark">{post.hashtags.join('  ')}</p>}
        {cardError && <p className="mt-1.5 text-xs text-red-600">{cardError}</p>}

        <div className="mt-4 flex items-center gap-5 border-t border-vibe-ink/5 pt-3">
          <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft transition-colors hover:text-vibe-pink-dark">
            <Heart size={18} className={liked ? 'fill-vibe-pink-dark text-vibe-pink-dark' : ''} /> {likeCount}
          </button>
          {linkToDetail ? (
            <Link to={`/community/${post.id}`} className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft transition-colors hover:text-vibe-ink">
              <MessageCircle size={18} /> {post.comments}
            </Link>
          ) : (
            <span className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft">
              <MessageCircle size={18} /> {post.comments}
            </span>
          )}
          <button onClick={handleShare} aria-label="Chia sẻ bài đăng" className="ml-auto text-vibe-ink-soft transition-colors hover:text-vibe-ink">
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
