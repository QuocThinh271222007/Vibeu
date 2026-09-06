import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Send, Trash2 } from 'lucide-react'
import { PostCard, PostCardSkeleton, remoteToFeedItem, type FeedItem } from '@/components/community/PostCard'
import { Avatar } from '@/components/ui/Avatar'
import { useToast } from '@/components/ui/Toast'
import {
  createComment,
  deleteComment,
  fetchComments,
  fetchCommunityPost,
  type CommunityComment,
} from '@/lib/communityApi'
import { useAuthStore } from '@/store/authStore'

export default function CommunityPost() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const { push } = useToast()
  const [post, setPost] = useState<FeedItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [commentText, setCommentText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const reloadPost = useCallback(() => {
    if (!id) return
    setLoading(true)
    fetchCommunityPost(id, profile?.id ?? null).then((p) => {
      if (!p) {
        setNotFound(true)
        setLoading(false)
        return
      }
      setPost(remoteToFeedItem(p))
      setLoading(false)
    })
  }, [id, profile?.id])

  const reloadComments = useCallback(() => {
    if (!id) return
    fetchComments(id).then(setComments)
  }, [id])

  useEffect(() => {
    reloadPost()
    reloadComments()
  }, [reloadPost, reloadComments])

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault()
    if (!id || !profile || !commentText.trim()) return
    setSubmitting(true)
    const { error } = await createComment(id, profile.id, commentText.trim())
    setSubmitting(false)
    if (error) {
      push('error', error)
      return
    }
    setCommentText('')
    reloadComments()
    reloadPost()
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Xoá bình luận này?')) return
    const { error } = await deleteComment(commentId)
    if (error) {
      push('error', error)
      return
    }
    reloadComments()
    reloadPost()
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <button
        onClick={() => navigate('/community')}
        className="mb-6 flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-vibe-ink shadow-sm transition-colors hover:bg-vibe-cream"
      >
        <ArrowLeft size={16} /> Về Cộng đồng
      </button>

      {loading ? (
        <PostCardSkeleton />
      ) : notFound || !post ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-vibe-ink-soft shadow-sm">
          Không tìm thấy bài đăng này — có thể đã bị xoá hoặc chưa được duyệt công khai.
        </p>
      ) : (
        <>
          <PostCard
            post={post}
            currentUserId={profile?.id ?? null}
            isAdmin={profile?.role === 'admin'}
            linkToDetail={false}
            onChanged={() => navigate('/community')}
          />

          <div className="mt-6 rounded-[1.75rem] bg-white p-5 shadow-[0_10px_30px_-18px_rgba(80,50,120,0.3)] sm:p-6">
            <p className="mb-4 font-display text-sm font-semibold text-vibe-ink">Bình luận ({comments.length})</p>

            {profile ? (
              <form onSubmit={handleSubmitComment} className="mb-5 flex items-start gap-2.5">
                <Avatar name={profile.displayName} color={profile.avatarColor} url={profile.avatarUrl} size={34} />
                <div className="flex flex-1 items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-vibe-cream/40 pl-4 pr-1.5">
                  <input
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Viết bình luận..."
                    className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none placeholder:text-vibe-ink-soft/60"
                  />
                  <button
                    type="submit"
                    disabled={!commentText.trim() || submitting}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-vibe-ink text-white disabled:opacity-30"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </form>
            ) : (
              <Link to="/auth?redirect=/community" className="mb-5 block text-xs font-semibold text-vibe-pink-dark hover:underline">
                Đăng nhập để bình luận
              </Link>
            )}

            {comments.length === 0 ? (
              <p className="text-sm text-vibe-ink-soft">Chưa có bình luận nào — hãy là người đầu tiên.</p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5">
                    <Link to={`/u/${c.authorId}`} className="shrink-0">
                      <Avatar name={c.avatarInitial} color={c.avatarColor} url={c.avatarUrl} size={34} />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <div className="rounded-2xl bg-vibe-cream/60 px-3.5 py-2.5">
                        <Link to={`/u/${c.authorId}`} className="text-xs font-semibold text-vibe-ink hover:underline">
                          {c.userName}
                        </Link>
                        <p className="text-sm text-vibe-ink">{c.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-3 pl-3.5 text-[11px] text-vibe-ink-soft">
                        <span>{c.timeAgo}</span>
                        {(profile?.id === c.authorId || profile?.role === 'admin') && (
                          <button onClick={() => handleDeleteComment(c.id)} className="flex items-center gap-1 hover:text-red-500">
                            <Trash2 size={11} /> Xoá
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
