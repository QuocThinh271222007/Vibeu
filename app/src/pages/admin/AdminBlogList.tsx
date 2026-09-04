import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { BLOG_CATEGORY_LABEL } from '@/data/blog'
import { useToast } from '@/components/ui/Toast'
import { deleteBlogPost, fetchAllBlogPostsAdmin, type BlogPostRow } from '@/lib/blogApi'
import { BLOG_POSTS } from '@/data/blog'

export default function AdminBlogList() {
  const { push } = useToast()
  const [rows, setRows] = useState<BlogPostRow[]>([])
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    fetchAllBlogPostsAdmin().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  async function handleDelete(id: string) {
    if (!confirm('Xoá bài viết này?')) return
    const { error } = await deleteBlogPost(id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá bài viết.')
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-vibe-ink">Blog</h1>
          <p className="mt-1 text-sm text-vibe-ink-soft">Bài viết đăng từ trang quản trị. Xuất hiện trên /blog cùng các bài biên tập sẵn.</p>
        </div>
        <Link to="/admin/blog/new" className="flex items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Bài viết mới
        </Link>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
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
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Chưa có bài viết nào đăng từ trang quản trị.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-vibe-ink">{r.title}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{BLOG_CATEGORY_LABEL[r.category]}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${r.published ? 'bg-emerald-50 text-emerald-700' : 'bg-vibe-cream text-vibe-ink-soft'}`}>
                      {r.published ? 'Đã đăng' : 'Bản nháp'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{new Date(r.created_at).toLocaleDateString('vi-VN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Link to={`/admin/blog/${r.id}`} className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-vibe-cream hover:text-vibe-ink">
                        <Pencil size={15} />
                      </Link>
                      <button onClick={() => handleDelete(r.id)} className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600">
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

      <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-display text-sm font-semibold text-vibe-ink">Bài viết biên tập sẵn ({BLOG_POSTS.length})</p>
        <p className="mt-1 text-sm text-vibe-ink-soft">Nằm trong mã nguồn (src/data/blog.ts), chưa chỉnh sửa được từ giao diện này.</p>
        <ul className="mt-2 space-y-1 text-sm text-vibe-ink-soft">
          {BLOG_POSTS.map((p) => (
            <li key={p.slug}>· {p.title}</li>
          ))}
        </ul>
      </div>
    </div>
  )
}
