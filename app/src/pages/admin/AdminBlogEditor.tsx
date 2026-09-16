import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { RichTextEditor } from '@/components/admin/RichTextEditor'
import {
  createBlogPost,
  DEFAULT_CREDIT_LINE,
  DEFAULT_CTA_BUTTON_LABEL,
  DEFAULT_CTA_BUTTON_URL,
  DEFAULT_CTA_TITLE,
  fetchBlogPostByIdAdmin,
  updateBlogPost,
  uploadBlogCover,
  type BlogPostInput,
} from '@/lib/blogApi'
import { blocksToHtml, htmlToPlainText } from '@/lib/blogContentHtml'
import { fetchAllBlogCategories, type BlogCategoryRow } from '@/lib/blogCategoriesApi'
import { fetchAllBlogSeries, type BlogSeriesRow } from '@/lib/blogSeriesApi'
import { slugify } from '@/lib/slug'
import { useAuthStore } from '@/store/authStore'

const EMPTY: BlogPostInput = {
  slug: '',
  title: '',
  category: 'tips',
  excerpt: '',
  content: [],
  contentBlocks: [],
  contentHtml: '',
  metaDescription: '',
  primaryKeyword: '',
  secondaryKeyword: '',
  creditLine: DEFAULT_CREDIT_LINE,
  showToc: true,
  ctaEnabled: true,
  ctaTitle: DEFAULT_CTA_TITLE,
  ctaButtonLabel: DEFAULT_CTA_BUTTON_LABEL,
  ctaButtonUrl: DEFAULT_CTA_BUTTON_URL,
  seriesId: null,
  accentColor: '#B6C7EA',
  coverSrc: null,
  coverAlt: null,
  published: true,
  readMinutes: 3,
}

function wordCount(text: string): number {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

/** Counter that turns green/amber/red around a target range — mirrors the writing template's
 * per-field word/char count guidance. Purely informational, never blocks saving. */
function RangeHint({ value, min, max, unit }: { value: number; min: number; max: number; unit: string }) {
  const inRange = value >= min && value <= max
  const close = !inRange && (value >= min * 0.7 || value <= max * 1.3)
  return (
    <span className={`text-[11px] font-medium ${inRange ? 'text-emerald-600' : close ? 'text-amber-600' : 'text-vibe-ink-soft'}`}>
      {value} {unit} (mục tiêu {min}-{max})
    </span>
  )
}

function normalizeForSearch(s: string): string {
  return s.toLocaleLowerCase('vi-VN')
}

function containsKeyword(text: string, keyword: string): boolean {
  return normalizeForSearch(text).includes(normalizeForSearch(keyword.trim()))
}

/** Detects an all-caps title ("KHÔNG VIẾT HOA TOÀN BỘ" per the writing template) — ignores
 * short titles/acronyms where a couple of capital letters is normal. */
function isShoutingCase(title: string): boolean {
  const letters = title.replace(/[^\p{L}]/gu, '')
  if (letters.length < 6) return false
  return letters === letters.toLocaleUpperCase('vi-VN') && letters !== letters.toLocaleLowerCase('vi-VN')
}

/** Small green/grey badge for "contains keyword X" checks scattered through the template
 * (title, meta description, sapo, headings, captions). Renders nothing until a keyword is set,
 * since there's nothing to check yet. */
function KeywordHint({ text, keyword, label }: { text: string; keyword: string; label: string }) {
  if (!keyword.trim()) return null
  const ok = containsKeyword(text, keyword)
  return <span className={`text-[11px] font-medium ${ok ? 'text-emerald-600' : 'text-vibe-ink-soft/60'}`}>{ok ? '✓' : '—'} {label}</span>
}

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [form, setForm] = useState<BlogPostInput>(EMPTY)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [seriesOptions, setSeriesOptions] = useState<BlogSeriesRow[]>([])
  const [categoryOptions, setCategoryOptions] = useState<BlogCategoryRow[]>([])

  useEffect(() => {
    fetchAllBlogSeries().then(setSeriesOptions)
    fetchAllBlogCategories().then(setCategoryOptions)
  }, [])

  useEffect(() => {
    if (isNew || !id) return
    fetchBlogPostByIdAdmin(id).then((row) => {
      if (!row) {
        setError('Không tìm thấy bài viết.')
        setLoading(false)
        return
      }
      // Posts saved before the WYSIWYG editor existed only have content_blocks — convert them to
      // HTML once so they open with their content intact instead of a blank editor. Posts already
      // saved through the new editor keep their content_html as-is; content_blocks is preserved
      // untouched either way (see blogApi.ts / schema.sql notes).
      const initialHtml = row.content_html?.trim() ? row.content_html : blocksToHtml(row.content_blocks ?? [])
      setForm({
        slug: row.slug,
        title: row.title,
        category: row.category,
        excerpt: row.excerpt,
        content: row.content,
        contentBlocks: row.content_blocks ?? [],
        contentHtml: initialHtml,
        metaDescription: row.meta_description ?? '',
        primaryKeyword: row.primary_keyword ?? '',
        secondaryKeyword: row.secondary_keyword ?? '',
        creditLine: row.credit_line ?? DEFAULT_CREDIT_LINE,
        showToc: row.show_toc ?? true,
        ctaEnabled: row.cta_enabled ?? true,
        ctaTitle: row.cta_title ?? DEFAULT_CTA_TITLE,
        ctaButtonLabel: row.cta_button_label ?? DEFAULT_CTA_BUTTON_LABEL,
        ctaButtonUrl: row.cta_button_url ?? DEFAULT_CTA_BUTTON_URL,
        seriesId: row.series_id ?? null,
        accentColor: row.accent_color,
        coverSrc: row.cover_src,
        coverAlt: row.cover_alt,
        published: row.published,
        readMinutes: row.read_minutes,
      })
      setSlugTouched(true)
      setLoading(false)
    })
  }, [id, isNew])

  function handleTitleChange(title: string) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }))
  }

  async function handleCoverFile(file: File) {
    if (!profile) return
    setUploadingCover(true)
    setError(null)
    const { url, error } = await uploadBlogCover(file, profile.id)
    setUploadingCover(false)
    if (error) {
      setError(error)
      return
    }
    setForm((f) => ({ ...f, coverSrc: url }))
  }

  async function handleEditorImageUpload(file: File): Promise<string | null> {
    if (!profile) return null
    const { url, error } = await uploadBlogCover(file, profile.id)
    if (error) {
      setError(error)
      return null
    }
    return url
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
    const input: BlogPostInput = { ...form, content: htmlToPlainText(form.contentHtml) }

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
    <div className="max-w-4xl">
      <button onClick={() => navigate('/admin/blog')} className="flex items-center gap-1.5 text-sm font-medium text-vibe-ink-soft hover:text-vibe-ink">
        <ArrowLeft size={16} /> Quay lại danh sách
      </button>

      <h1 className="mt-3 font-display text-2xl font-semibold text-vibe-ink">{isNew ? 'Bài viết mới' : 'Chỉnh sửa bài viết'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <Field label="Tiêu đề (không viết hoa toàn bộ, 50-60 ký tự)">
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <div className="mt-1 flex items-center justify-between">
            <KeywordHint text={form.title} keyword={form.primaryKeyword} label="chứa từ khoá chính" />
            <RangeHint value={form.title.length} min={50} max={60} unit="ký tự" />
          </div>
          {isShoutingCase(form.title) && (
            <p className="mt-1 text-[11px] font-medium text-amber-600">Tiêu đề đang viết hoa toàn bộ — chỉ nên viết hoa chữ đầu.</p>
          )}
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
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
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

        <Field label="Mục lục (tuỳ chọn — gom bài này vào một series)">
          <select
            value={form.seriesId ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, seriesId: e.target.value || null }))}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          >
            <option value="">Không thuộc mục lục nào</option>
            {seriesOptions.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </Field>

        <div className="rounded-2xl border-2 border-vibe-blue/30 bg-vibe-blue/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-vibe-blue-dark">Tối ưu SEO</p>
          <div className="mt-3 grid grid-cols-2 gap-4">
            <Field label="Từ khoá chính">
              <input
                value={form.primaryKeyword}
                onChange={(e) => setForm((f) => ({ ...f, primaryKeyword: e.target.value }))}
                className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
              />
            </Field>
            <Field label="Từ khoá phụ">
              <input
                value={form.secondaryKeyword}
                onChange={(e) => setForm((f) => ({ ...f, secondaryKeyword: e.target.value }))}
                className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
              />
            </Field>
          </div>
          <Field label="Meta description (hiện trên kết quả tìm kiếm Google)">
            <textarea
              rows={2}
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              className="w-full resize-none rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            />
            <div className="mt-1 flex items-center justify-between">
              <KeywordHint text={form.metaDescription} keyword={form.primaryKeyword} label="chứa từ khoá chính" />
              <RangeHint value={form.metaDescription.length} min={120} max={150} unit="ký tự" />
            </div>
          </Field>
        </div>

        <Field label="Sapo — đoạn mở đầu (hiển thị ở danh sách, chứa từ khoá chính + tên VIBEU)">
          <textarea
            required
            rows={2}
            value={form.excerpt}
            onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
            className="w-full resize-none rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <div className="mt-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeywordHint text={form.excerpt} keyword={form.primaryKeyword} label="chứa từ khoá chính" />
              <KeywordHint text={form.excerpt} keyword="VIBEU" label="nhắc VIBEU" />
            </div>
            <RangeHint value={wordCount(form.excerpt)} min={80} max={100} unit="từ" />
          </div>
        </Field>

        <Field label="Nội dung bài viết">
          <RichTextEditor
            content={form.contentHtml}
            onChange={(html) => setForm((f) => ({ ...f, contentHtml: html }))}
            onUploadImage={handleEditorImageUpload}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Ảnh đại diện bài viết (tải lên hoặc dán URL)">
            <div className="flex items-center gap-2">
              <input
                value={form.coverSrc ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, coverSrc: e.target.value || null }))}
                placeholder="/assets/blog/... hoặc https://..."
                className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border-2 border-vibe-ink/10 px-3 py-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink">
                <Upload size={14} />
                {uploadingCover ? 'Đang tải...' : 'Tải ảnh'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  disabled={uploadingCover}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleCoverFile(file)
                    e.target.value = ''
                  }}
                />
              </label>
            </div>
            {form.coverSrc && <img src={form.coverSrc} alt="" className="mt-2 h-24 w-full rounded-lg object-cover" />}
          </Field>
          <Field label="Caption ảnh đại diện (alt, nên chứa từ khoá chính)">
            <input
              value={form.coverAlt ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, coverAlt: e.target.value || null }))}
              className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
            />
            <div className="mt-1">
              <KeywordHint text={form.coverAlt ?? ''} keyword={form.primaryKeyword} label="chứa từ khoá chính" />
            </div>
          </Field>
        </div>

        <Field label="Dòng credit cuối bài (chữ ký, hiện ở cuối trang)">
          <input
            value={form.creditLine}
            onChange={(e) => setForm((f) => ({ ...f, creditLine: e.target.value }))}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </Field>

        <div className="space-y-3 rounded-2xl border-2 border-vibe-blue/30 bg-vibe-blue/5 p-4">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-vibe-ink">
            <input
              type="checkbox"
              checked={form.ctaEnabled}
              onChange={(e) => setForm((f) => ({ ...f, ctaEnabled: e.target.checked }))}
              className="h-4 w-4 rounded border-2 border-vibe-ink/20"
            />
            Hiển thị khối CTA cuối bài
          </label>
          {form.ctaEnabled && (
            <>
              <Field label="Tiêu đề CTA">
                <input
                  value={form.ctaTitle}
                  onChange={(e) => setForm((f) => ({ ...f, ctaTitle: e.target.value }))}
                  className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Chữ trên nút">
                  <input
                    value={form.ctaButtonLabel}
                    onChange={(e) => setForm((f) => ({ ...f, ctaButtonLabel: e.target.value }))}
                    className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
                  />
                </Field>
                <Field label="Đường dẫn nút (vd: /studio)">
                  <input
                    value={form.ctaButtonUrl}
                    onChange={(e) => setForm((f) => ({ ...f, ctaButtonUrl: e.target.value }))}
                    className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
                  />
                </Field>
              </div>
            </>
          )}
        </div>

        <label className="flex items-center gap-2.5 text-sm font-medium text-vibe-ink">
          <input
            type="checkbox"
            checked={form.showToc}
            onChange={(e) => setForm((f) => ({ ...f, showToc: e.target.checked }))}
            className="h-4 w-4 rounded border-2 border-vibe-ink/20"
          />
          Hiển thị mục lục (tự động tạo từ các Heading 2/3 bên trên)
        </label>

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
