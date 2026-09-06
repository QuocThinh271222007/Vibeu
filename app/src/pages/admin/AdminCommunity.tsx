import { useEffect, useMemo, useState } from 'react'
import { Check, Eye, Search, Star, Trash2, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import {
  deleteCommunityPost,
  fetchCommunityPosts,
  setApproved,
  setFeatured,
  updateCommunityPost,
  type RemoteCommunityPost,
} from '@/lib/communityApi'

type StatusFilter = 'pending' | 'approved' | 'all'

export default function AdminCommunity() {
  const { push } = useToast()
  const [posts, setPosts] = useState<RemoteCommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<StatusFilter>('pending')
  const [detailPost, setDetailPost] = useState<RemoteCommunityPost | null>(null)

  function reload() {
    setLoading(true)
    fetchCommunityPosts(null).then((data) => {
      setPosts(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const pendingCount = useMemo(() => posts.filter((p) => !p.approved).length, [posts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return posts
      .filter((p) => (status === 'all' ? true : status === 'pending' ? !p.approved : p.approved))
      .filter((p) => !q || p.userName.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q))
  }, [posts, query, status])

  async function handleDelete(id: string) {
    if (!confirm('Xoá bài đăng này?')) return
    const { error } = await deleteCommunityPost(id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá bài đăng.')
    reload()
  }

  async function handleToggleFeatured(p: RemoteCommunityPost) {
    const { error } = await setFeatured(p.id, !p.featured)
    if (error) {
      push('error', error)
      return
    }
    push('success', p.featured ? 'Đã bỏ ghim bài đăng.' : 'Đã ghim bài đăng nổi bật.')
    reload()
  }

  async function handleToggleApproved(p: RemoteCommunityPost) {
    const { error } = await setApproved(p.id, !p.approved)
    if (error) {
      push('error', error)
      return
    }
    push('success', p.approved ? 'Đã ẩn bài đăng, chờ duyệt lại.' : 'Đã duyệt, bài đăng hiện công khai.')
    reload()
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Cộng đồng</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">
        Bài đăng thật từ người dùng. Bài mới đăng ở trạng thái chờ duyệt, chỉ tác giả thấy được cho tới khi admin duyệt công khai.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <label className="flex max-w-xs flex-1 items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2">
          <Search size={15} className="text-vibe-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tác giả hoặc nội dung..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
          />
        </label>

        <div className="flex items-center gap-1 rounded-full bg-vibe-cream p-1">
          {(
            [
              ['pending', `Chờ duyệt${pendingCount > 0 ? ` (${pendingCount})` : ''}`],
              ['approved', 'Đã duyệt'],
              ['all', 'Tất cả'],
            ] as [StatusFilter, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setStatus(id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                status === id ? 'bg-vibe-ink text-white' : 'text-vibe-ink-soft hover:text-vibe-ink'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Tác giả</th>
              <th className="px-4 py-3">Nội dung</th>
              <th className="px-4 py-3">Lượt thích</th>
              <th className="px-4 py-3">Đăng lúc</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  {posts.length === 0
                    ? 'Chưa có bài đăng thật nào từ người dùng.'
                    : status === 'pending'
                      ? 'Không có bài nào đang chờ duyệt.'
                      : 'Không tìm thấy bài đăng phù hợp.'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-vibe-ink/5 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-vibe-ink">
                    <div className="flex items-center gap-1.5">
                      {p.featured && <Star size={13} className="fill-amber-400 text-amber-400" />}
                      {p.userName}
                      {!p.approved && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Chờ duyệt</span>
                      )}
                    </div>
                  </td>
                  <td className="max-w-md px-4 py-3 text-vibe-ink-soft">
                    <p className="line-clamp-2">{p.caption}</p>
                  </td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{p.likes}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-vibe-ink-soft">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleApproved(p)}
                        title={p.approved ? 'Ẩn, chờ duyệt lại' : 'Duyệt công khai'}
                        className={`grid h-8 w-8 place-items-center rounded-lg hover:bg-emerald-50 ${p.approved ? 'text-emerald-600' : 'text-vibe-ink-soft hover:text-emerald-600'}`}
                      >
                        {p.approved ? <X size={15} /> : <Check size={15} />}
                      </button>
                      <button onClick={() => setDetailPost(p)} title="Xem chi tiết" className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-vibe-cream hover:text-vibe-ink">
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => handleToggleFeatured(p)}
                        title={p.featured ? 'Bỏ ghim' : 'Ghim nổi bật'}
                        className={`grid h-8 w-8 place-items-center rounded-lg hover:bg-amber-50 ${p.featured ? 'text-amber-500' : 'text-vibe-ink-soft hover:text-amber-500'}`}
                      >
                        <Star size={15} className={p.featured ? 'fill-amber-400' : ''} />
                      </button>
                      <button onClick={() => handleDelete(p.id)} title="Xoá" className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detailPost && (
        <CommunityPostDetailModal
          post={detailPost}
          onClose={() => setDetailPost(null)}
          onSaved={() => {
            setDetailPost(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function CommunityPostDetailModal({ post, onClose, onSaved }: { post: RemoteCommunityPost; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const [editing, setEditing] = useState(false)
  const [caption, setCaption] = useState(post.caption)
  const [hashtags, setHashtags] = useState(post.hashtags.join(' '))
  const [mediaUrl, setMediaUrl] = useState(post.media?.src ?? '')
  const [mediaAlt, setMediaAlt] = useState(post.media?.alt ?? '')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const { error } = await updateCommunityPost(post.id, {
      caption: caption.trim(),
      hashtags: hashtags
        .split(/[\s,]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => (t.startsWith('#') ? t : `#${t}`)),
      mediaUrl: mediaUrl.trim() || null,
      mediaAlt: mediaAlt.trim() || null,
    })
    setSaving(false)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã lưu thay đổi.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-vibe-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold text-vibe-ink">{post.userName}</p>
            <p className="text-xs text-vibe-ink-soft">{post.handle} · {new Date(post.createdAt).toLocaleString('vi-VN')}</p>
          </div>
          <button onClick={onClose} className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-vibe-ink-soft hover:bg-vibe-cream">
            <X size={16} />
          </button>
        </div>

        {editing ? (
          <div className="mt-4 space-y-2.5">
            <input
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder="URL ảnh (để trống nếu không có ảnh)"
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
            />
            {mediaUrl && (
              <input
                value={mediaAlt}
                onChange={(e) => setMediaAlt(e.target.value)}
                placeholder="Mô tả ảnh (alt text)"
                className="w-full rounded-xl border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
              />
            )}
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
            />
            <input
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              placeholder="#hashtag #của #bài"
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditing(false)} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft">
                Huỷ
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {post.media && (
              <img src={post.media.src} alt={post.media.alt} className="mt-4 max-h-96 w-full rounded-xl object-cover" />
            )}

            <p className="mt-4 whitespace-pre-wrap text-sm text-vibe-ink">{post.caption}</p>
            {post.hashtags.length > 0 && (
              <p className="mt-2 text-xs text-vibe-blue-dark">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-vibe-ink-soft">
              <span>{post.likes} lượt thích</span>
              <span>{post.comments} bình luận</span>
              {post.templateId && <span>Mẫu: {post.templateId}</span>}
              {post.featured && <span className="font-semibold text-amber-600">Đang ghim nổi bật</span>}
              {!post.approved && <span className="font-semibold text-amber-700">Đang chờ duyệt</span>}
              <button onClick={() => setEditing(true)} className="ml-auto font-semibold text-vibe-ink underline">
                Sửa nội dung
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
