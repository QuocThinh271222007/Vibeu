import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'
import { fetchAllBlogPostsAdmin, type BlogPostRow } from '@/lib/blogApi'
import { createBlogCategory, deleteBlogCategory, fetchAllBlogCategories, updateBlogCategory, type BlogCategoryRow } from '@/lib/blogCategoriesApi'
import { slugify } from '@/lib/slug'

export default function AdminBlogCategories() {
  const { push } = useToast()
  const [rows, setRows] = useState<BlogCategoryRow[]>([])
  const [posts, setPosts] = useState<BlogPostRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BlogCategoryRow | 'new' | null>(null)

  function reload() {
    setLoading(true)
    Promise.all([fetchAllBlogCategories(), fetchAllBlogPostsAdmin()]).then(([categories, allPosts]) => {
      setRows(categories)
      setPosts(allPosts)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  function postCount(slug: string): number {
    return posts.filter((p) => p.category === slug).length
  }

  async function handleDelete(row: BlogCategoryRow) {
    const count = postCount(row.slug)
    const warning = count > 0 ? ` ${count} bài viết đang dùng danh mục này sẽ vẫn giữ nguyên nhãn "${row.name}" cho tới khi bạn sửa lại từng bài.` : ''
    if (!confirm(`Xoá danh mục "${row.name}"?${warning}`)) return
    const { error } = await deleteBlogCategory(row.id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá danh mục.')
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-vibe-ink">Danh mục</h1>
          <p className="mt-1 text-sm text-vibe-ink-soft">
            Danh mục bắt buộc cho mỗi bài blog (vd: "Mẹo làm đẹp") — dùng để lọc ở trang Blog. Khác với "Mục lục" (tuỳ chọn, gom
            nhiều bài thành series).
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Danh mục mới
        </button>
      </div>

      <div className="mt-6 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-vibe-ink/10 text-xs uppercase tracking-wide text-vibe-ink-soft">
              <th className="px-4 py-3">Tên danh mục</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Số bài</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Đang tải...
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-vibe-ink-soft">
                  Chưa có danh mục nào.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-vibe-ink/5 last:border-0">
                  <td className="px-4 py-3 font-medium text-vibe-ink">{r.name}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{r.slug}</td>
                  <td className="px-4 py-3 text-vibe-ink-soft">{postCount(r.slug)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(r)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-vibe-cream hover:text-vibe-ink"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(r)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600"
                      >
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

      {editing && (
        <EditCategoryModal
          row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

function EditCategoryModal({ row, onClose, onSaved }: { row: BlogCategoryRow | null; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const [name, setName] = useState(row?.name ?? '')
  const [slug, setSlug] = useState(row?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(row))
  const [saving, setSaving] = useState(false)

  function handleNameChange(v: string) {
    setName(v)
    if (!slugTouched) setSlug(slugify(v))
  }

  async function handleSave() {
    if (!name.trim() || !slug.trim()) return
    setSaving(true)
    const input = { name: name.trim(), slug: slug.trim() }
    const { error } = row ? await updateBlogCategory(row.id, input) : await createBlogCategory(input)
    setSaving(false)
    if (error) {
      push('error', error)
      return
    }
    push('success', row ? 'Đã lưu thay đổi.' : 'Đã tạo danh mục.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-vibe-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-vibe-ink">{row ? 'Sửa danh mục' : 'Danh mục mới'}</p>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft hover:bg-vibe-cream">
            <X size={16} />
          </button>
        </div>

        <input
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Tên danh mục…"
          className="mt-3 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
        />
        <input
          value={slug}
          onChange={(e) => {
            setSlugTouched(true)
            setSlug(slugify(e.target.value))
          }}
          placeholder="slug-danh-muc"
          className="mt-2 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
        />

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || !slug.trim() || saving}
            className="rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Đang lưu...' : row ? 'Lưu thay đổi' : 'Tạo danh mục'}
          </button>
        </div>
      </div>
    </div>
  )
}
