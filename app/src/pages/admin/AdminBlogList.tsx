import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { deleteBlogPost, fetchAllBlogPostsAdmin, type BlogPostRow } from '@/lib/blogApi'
import { fetchAllBlogCategories, type BlogCategoryRow } from '@/lib/blogCategoriesApi'
import { fetchAllBlogSeries, type BlogSeriesRow } from '@/lib/blogSeriesApi'

export default function AdminBlogList() {
  const { push } = useToast()
  const [rows, setRows] = useState<BlogPostRow[]>([])
  const [categories, setCategories] = useState<BlogCategoryRow[]>([])
  const [series, setSeries] = useState<BlogSeriesRow[]>([])
  const [seriesFilter, setSeriesFilter] = useState<string | 'all'>('all')
  const [loading, setLoading] = useState(true)

  function reload() {
    setLoading(true)
    Promise.all([fetchAllBlogPostsAdmin(), fetchAllBlogCategories(), fetchAllBlogSeries()]).then(([posts, allCategories, allSeries]) => {
      setRows(posts)
      setCategories(allCategories)
      setSeries(allSeries)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const categoryBySlug = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories])
  const seriesById = useMemo(() => new Map(series.map((s) => [s.id, s.name])), [series])
  const filteredRows = seriesFilter === 'all' ? rows : rows.filter((r) => r.series_id === seriesFilter)

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
          <p className="mt-1 text-sm text-vibe-ink-soft">Toàn bộ bài viết trên /blog, kể cả các bài biên tập sẵn ban đầu — sửa/xoá được tại đây.</p>
        </div>
        <Link to="/admin/blog/new" className="flex items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white">
          <Plus size={16} /> Bài viết mới
        </Link>
      </div>

      {series.length > 0 && (
        <label className="mt-4 flex items-center gap-2 text-sm text-vibe-ink-soft">
          Lọc theo mục lục:
          <select
            value={seriesFilter}
            onChange={(e) => setSeriesFilter(e.target.value)}
            className="rounded-xl border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
          >
            <option value="all">Tất cả</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Tiêu đề</th>
              <th className="px-4 py-3">Danh mục</th>
              <th className="px-4 py-3">Mục lục</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Ngày tạo</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Đang tải...
                </td>
              </tr>
            ) : filteredRows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-vibe-ink-soft">
                  {rows.length === 0 ? 'Chưa có bài viết nào đăng từ trang quản trị.' : 'Không có bài viết nào thuộc mục lục này.'}
                </td>
              </tr>
            ) : (
              filteredRows.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-vibe-ink">{r.title}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{categoryBySlug.get(r.category) ?? r.category}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.series_id ? (seriesById.get(r.series_id) ?? '—') : '—'}</td>
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
    </div>
  )
}
