import { useEffect, useMemo, useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { COMMUNITY_POSTS } from '@/data/community'
import { useToast } from '@/components/ui/Toast'
import { deleteCommunityPost, fetchCommunityPosts, type RemoteCommunityPost } from '@/lib/communityApi'

export default function AdminCommunity() {
  const { push } = useToast()
  const [posts, setPosts] = useState<RemoteCommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')

  function reload() {
    setLoading(true)
    fetchCommunityPosts(null).then((data) => {
      setPosts(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return posts
    return posts.filter((p) => p.userName.toLowerCase().includes(q) || p.caption.toLowerCase().includes(q))
  }, [posts, query])

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

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-vibe-ink">Cộng đồng</h1>
      <p className="mt-1 text-sm text-vibe-ink-soft">Bài đăng thật từ người dùng. Có thể gỡ bài vi phạm quy tắc cộng đồng tại đây.</p>

      <label className="mt-5 flex max-w-xs items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2">
        <Search size={15} className="text-vibe-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tác giả hoặc nội dung..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
        />
      </label>

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
                  {posts.length === 0 ? 'Chưa có bài đăng thật nào từ người dùng.' : 'Không tìm thấy bài đăng phù hợp.'}
                </td>
              </tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="border-b border-vibe-ink/5 last:border-0 align-top">
                  <td className="whitespace-nowrap px-4 py-3 font-medium text-vibe-ink">{p.userName}</td>
                  <td className="max-w-md px-4 py-3 text-vibe-ink-soft">
                    <p className="line-clamp-2">{p.caption}</p>
                  </td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{p.likes}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-vibe-ink-soft">{new Date(p.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(p.id)} className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-display text-sm font-semibold text-vibe-ink">Bài đăng demo có sẵn ({COMMUNITY_POSTS.length})</p>
        <p className="mt-1 text-sm text-vibe-ink-soft">Nằm trong mã nguồn (src/data/community.ts), không xoá được từ giao diện này.</p>
      </div>
    </div>
  )
}
