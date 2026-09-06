import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Heart, MessageCircle, Share2, Sparkles, Trash2, X } from 'lucide-react'
import { HandCanvas } from '@/components/studio/HandCanvas'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
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
  approved: boolean
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
    approved: p.approved,
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
    approved: true,
  }
}

function PostCardSkeleton() {
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

export default function Community() {
  const { status, profile } = useAuthStore()
  const [remotePosts, setRemotePosts] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null)
  const [authorFilter, setAuthorFilter] = useState<{ id: string; name: string } | null>(null)
  const [params] = useSearchParams()
  const highlightId = params.get('post')

  const reload = useCallback(() => {
    if (!isSupabaseConfigured) return
    fetchCommunityPosts(profile?.id ?? null).then((posts) => {
      setRemotePosts(posts.map(remoteToFeedItem))
      setLoading(false)
    })
  }, [profile?.id])

  useEffect(() => {
    reload()
  }, [reload])

  useEffect(() => {
    if (!highlightId || loading) return
    document.getElementById(`post-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [highlightId, loading])

  const feed = [...remotePosts, ...COMMUNITY_POSTS.map(staticToFeedItem)]

  const allHashtags = useMemo(() => {
    const set = new Set<string>()
    for (const p of feed) for (const h of p.hashtags) set.add(h)
    return [...set].slice(0, 12)
  }, [feed])

  const filtered = feed.filter((p) => {
    if (hashtagFilter && !p.hashtags.includes(hashtagFilter)) return false
    if (authorFilter && p.authorId !== authorFilter.id) return false
    return true
  })

  function viewAuthor(authorId: string | null, name: string) {
    if (!authorId) return
    setAuthorFilter({ id: authorId, name })
    setHashtagFilter(null)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Cộng đồng
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Vibe hôm nay của mọi người</h1>
        <p className="mx-auto mt-3 max-w-md text-vibe-ink-soft">
          Nơi khoe bộ nail bạn tự thiết kế trên VIBEU và xin vía từ mọi người — thích và đăng bài được ngay.
        </p>
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

        <div className="mb-6 space-y-3">
          {profile && (
            <button
              onClick={() => (authorFilter?.id === profile.id ? setAuthorFilter(null) : viewAuthor(profile.id, 'Bài của tôi'))}
              className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                authorFilter?.id === profile.id ? 'border-vibe-pink-dark bg-vibe-pink/10 text-vibe-pink-dark' : 'border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-pink/40'
              }`}
            >
              Bài của tôi
            </button>
          )}
          {allHashtags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {allHashtags.map((h) => (
                <button
                  key={h}
                  onClick={() => setHashtagFilter((cur) => (cur === h ? null : h))}
                  className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition-colors ${
                    hashtagFilter === h ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-blue/40'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
          {authorFilter && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-vibe-ink-soft">
              Đang xem bài của <span className="font-semibold text-vibe-ink">{authorFilter.name}</span>
              <button onClick={() => setAuthorFilter(null)} className="grid h-5 w-5 place-items-center rounded-full hover:bg-vibe-cream">
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Không có bài đăng nào khớp bộ lọc.</p>
          ) : (
            filtered.map((post, i) => (
              <PostCard
                key={post.id}
                post={post}
                index={i}
                currentUserId={profile?.id ?? null}
                isAdmin={profile?.role === 'admin'}
                highlighted={post.id === highlightId}
                onChanged={reload}
                onViewAuthor={() => viewAuthor(post.authorId, post.userName)}
              />
            ))
          )}
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
  highlighted,
  onChanged,
  onViewAuthor,
}: {
  post: FeedItem
  index: number
  currentUserId: string | null
  isAdmin: boolean
  highlighted: boolean
  onChanged: () => void
  onViewAuthor: () => void
}) {
  const { push } = useToast()
  const [liked, setLiked] = useState(post.likedByMe)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [cardError, setLikeError] = useState<string | null>(null)
  const template = post.templateId ? findTemplate(post.templateId) : undefined

  async function handleShare() {
    const shareData = { title: `${post.userName} trên VIBEU`, text: post.caption, url: `${window.location.origin}/community?post=${post.id}` }
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
      push('success', 'Đã sao chép liên kết Cộng đồng.')
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
        <button onClick={onViewAuthor} disabled={!post.authorId} className="shrink-0 disabled:cursor-default">
          <Avatar name={post.avatarInitial} color={post.avatarColor} url={post.avatarUrl} size={40} />
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={onViewAuthor} disabled={!post.authorId} className="flex items-center gap-1.5 truncate text-sm font-semibold text-vibe-ink disabled:cursor-default">
            <span className={`truncate ${post.authorId ? 'hover:underline' : ''}`}>{post.userName}</span>
            {!post.approved && (
              <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                Chờ duyệt, chỉ bạn thấy
              </span>
            )}
          </button>
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
          <button onClick={handleShare} aria-label="Chia sẻ bài đăng" className="ml-auto text-vibe-ink-soft transition-colors hover:text-vibe-ink">
            <Share2 size={17} />
          </button>
        </div>
      </div>
    </motion.article>
  )
}
