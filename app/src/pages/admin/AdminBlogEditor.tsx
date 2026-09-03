import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { BlogCategory } from '@/data/blog'
import { BLOG_CATEGORY_LABEL } from '@/data/blog'
import { createBlogPost, fetchBlogPostByIdAdmin, updateBlogPost, type BlogPostInput } from '@/lib/blogApi'
import { useAuthStore } from '@/store/authStore'

const CATEGORIES: BlogCategory[] = ['tips', 'trend', 'care']

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g')

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY: BlogPostInput = {
  slug: '',
  title: '',
  category: 'tips',
  excerpt: '',
  content: [''],
  accentColor: '#B6C7EA',
  coverSrc: null,
  coverAlt: null,
  published: true,
  readMinutes: 3,
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [form, setForm] = useState<BlogPostInput>(EMPTY)
  const [contentRaw, setContentRaw] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew || !id) return
    fetchBlogPostByIdAdmin(id).then((row) => {
      if (!row) {
        setError('Không tìm thấy bài viết.')
        setLoading(false)
        return
      }
      setForm({
        slug: row.slug,
        title: row.title,
        category: row.category,
        excerpt: row.excerpt,
        content: row.content.length ? row.content : [''],
        accentColor: row.accent_color,
        coverSrc: row.cover_src,
        coverAlt: row.cover_alt,
        published: row.published,
        readMinutes: row.read_minutes,
      })
      setContentRaw(row.content.join('\n\n'))
      setSlugTouched(true)
      setLoading(false)
    })
  }, [id, isNew])

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    if (!form.title.trim() || !form.slug.trim()) {
      setError('Cần có tiêu đề và slug.')
      return
    }
    setError(null)
    setSaving(true)
    const content = contentRaw
      .split(/\n{2,}/)
      .map((p) => p.trim())
      .filter(Boolean)
    const input: BlogPostInput = { ...form, content: content.length ? content : [form.excerpt] }

    const { error } = isNew ? await createBlogPost(input, profile.id) : await updateBlogPost(id!, input)
    setSaving(false)
    if (error) {
      setError(error)
      return
    }
    navigate('/admin/blog')
  }

  if (loading) return <p className="text-vibe-ink-soft">Đang tải...</p>

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/admin/blog')} className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft hover:text-vibe-ink">
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <h1 className="mt-3 font-display text-2xl font-semibold text-vibe-ink">{isNew ? 'Bài viết mới' : 'Chỉnh sửa bài viết'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <Field label="Tiêu đề">
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </Field>

        <Field label="Slug (đường dẫn URL)">
          <input
            required
            value={form.slug}
            onChange={(e) => {
              setSlugTouched(true)
              setForm((f) => ({ ...f, slug: slugify(e.target.value) }))
            }}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Danh mục">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as BlogCategory }))}
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {BLOG_CATEGORY_LABEL[c]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Thời gian đọc (phút)">
            <input
              type="number"
              min={1}
              value={form.readMinutes}
              onChange={(e) => setForm((f) => ({ ...f, readMinutes: Number(e.target.value) || 1 }))}
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </Field>
        </div>

        <Field label="Tóm tắt (hiển thị ở danh sách)">
          <textarea
            required
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full resize-none rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </Field>

        <Field label="Nội dung (mỗi đoạn cách nhau 1 dòng trống)">
          <textarea
            required
            rows={8}
            value={contentRaw}
            onChange={(e) => setContentRaw(e.target.value)}
            className="w-full resize-y rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ảnh bìa (URL, tuỳ chọn)">
            <input
              value={form.coverSrc ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, coverSrc: e.target.value || null }))}
              placeholder="/assets/blog/... hoặc https://..."
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </Field>
          <Field label="Mô tả ảnh bìa (alt)">
            <input
              value={form.coverAlt ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, coverAlt: e.target.value || null }))}
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </Field>
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-vibe-ink">
          <input
            type="checkbox"
            checked={form.published}
            onChange={(e) => setForm((f) => ({ ...f, published: e.target.checked }))}
            className="h-4 w-4 rounded border-2 border-vibe-ink/20"
          />
          Đăng công khai ngay
        </label>

        {error && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="submit" size="sm" disabled={saving}>
            <Save size={16} /> {saving ? 'Đang lưu...' : 'Lưu bài viết'}
          </Button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vibe-ink-soft">{label}</span>
      {children}
    </label>
  )
}
