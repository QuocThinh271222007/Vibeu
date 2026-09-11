import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { PostCard, PostCardSkeleton, remoteToFeedItem, staticToFeedItem, type FeedItem } from '@/components/community/PostCard'
import { NewPostComposer } from '@/components/community/NewPostComposer'
import { COMMUNITY_POSTS } from '@/data/community'
import { fetchCommunityPosts } from '@/lib/communityApi'
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import { useAuthStore } from '@/store/authStore'
import { PageMeta } from '@/components/seo/PageMeta'

export default function Community() {
  const { status, profile } = useAuthStore()
  const [remotePosts, setRemotePosts] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [hashtagFilter, setHashtagFilter] = useState<string | null>(null)
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

  const filtered = hashtagFilter ? feed.filter((p) => p.hashtags.includes(hashtagFilter)) : feed

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <PageMeta
        title="Cộng đồng"
        description="Xem bộ nail của cộng đồng VIBEU, thích, bình luận và chia sẻ thiết kế bạn vừa hoàn thành từ Studio."
        canonicalPath="/community"
      />
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Cộng đồng
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">Vibe hôm nay của mọi người</h1>
        <p className="mx-auto mt-3 max-w-md text-vibe-ink-soft">
          Mạng xã hội thu nhỏ của VIBEU — đăng bài, thích, bình luận, xem trang cá nhân của nhau.
        </p>
      </div>

      <div className="mt-10">
        {status === 'signedIn' && profile ? (
          <NewPostComposer profile={profile} onCreated={reload} />
        ) : (
          <Link
            to="/auth?redirect=/community"
            className="mb-6 flex items-center gap-3 rounded-[1.75rem] bg-vibe-highlight p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] transition-shadow hover:shadow-vibe"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-vibe-pink/10 text-vibe-pink-dark">
              <Sparkles size={18} />
            </span>
            <span className="text-sm font-medium text-vibe-ink">
              <span className="font-semibold text-vibe-pink-dark">Đăng nhập</span> để chia sẻ bộ nail bạn vừa thiết kế với cộng đồng VIBEU
            </span>
          </Link>
        )}

        {profile && (
          <div className="mb-4">
            <Link
              to={`/u/${profile.id}`}
              className="inline-flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink"
            >
              Trang cá nhân của tôi
            </Link>
          </div>
        )}

        {allHashtags.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-1.5">
            <button
              onClick={() => setHashtagFilter(null)}
              className={`rounded-full border-2 px-3 py-1 text-xs font-medium transition-colors ${
                hashtagFilter === null ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-blue/40'
              }`}
            >
              Tất cả
            </button>
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

        <div className="space-y-6">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <PostCardSkeleton key={i} />)
          ) : filtered.length === 0 ? (
            <p className="rounded-2xl bg-vibe-highlight p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Không có bài đăng nào khớp bộ lọc.</p>
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
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
