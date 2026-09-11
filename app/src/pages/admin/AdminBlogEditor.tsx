import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowDown, ArrowLeft, ArrowUp, Heading2, Heading3, ImagePlus, Pilcrow, Save, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { BlogCategory, ContentBlock } from '@/data/blog'
import { BLOG_CATEGORY_LABEL } from '@/data/blog'
import { createBlogPost, fetchBlogPostByIdAdmin, updateBlogPost, uploadBlogCover, type BlogPostInput } from '@/lib/blogApi'
import { slugify } from '@/lib/slug'
import { useAuthStore } from '@/store/authStore'

const CATEGORIES: BlogCategory[] = ['tips', 'trend', 'care']

const EMPTY_BLOCKS: ContentBlock[] = [{ type: 'paragraph', text: '' }]

const EMPTY: BlogPostInput = {
  slug: '',
  title: '',
  category: 'tips',
  excerpt: '',
  content: [],
  contentBlocks: EMPTY_BLOCKS,
  metaDescription: '',
  primaryKeyword: '',
  secondaryKeyword: '',
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

/** Plain-text mirror stored alongside content_blocks — see blog_posts.content in schema.sql. */
function blocksToPlainText(blocks: ContentBlock[]): string[] {
  return blocks
    .filter((b): b is Extract<ContentBlock, { text: string }> => b.type !== 'image')
    .map((b) => b.text.trim())
    .filter(Boolean)
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

export default function AdminBlogEditor() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id
  const navigate = useNavigate()
  const { profile } = useAuthStore()
  const [form, setForm] = useState<BlogPostInput>(EMPTY)
  const [blocks, setBlocks] = useState<ContentBlock[]>(EMPTY_BLOCKS)
  const [slugTouched, setSlugTouched] = useState(false)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [uploadingBlock, setUploadingBlock] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isNew || !id) return
    fetchBlogPostByIdAdmin(id).then((row) => {
      if (!row) {
        setError('Không tìm thấy bài viết.')
        setLoading(false)
        return
      }
      // Posts written before content_blocks existed (or before the one-time DB backfill has
      // run) still open with their old paragraphs intact, just as plain-paragraph blocks.
      const initialBlocks: ContentBlock[] =
        row.content_blocks?.length > 0
          ? row.content_blocks
          : row.content.length > 0
            ? row.content.map((text) => ({ type: 'paragraph' as const, text }))
            : EMPTY_BLOCKS
      setBlocks(initialBlocks)
      setForm({
        slug: row.slug,
        title: row.title,
        category: row.category,
        excerpt: row.excerpt,
        content: row.content,
        contentBlocks: initialBlocks,
        metaDescription: row.meta_description ?? '',
        primaryKeyword: row.primary_keyword ?? '',
        secondaryKeyword: row.secondary_keyword ?? '',
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

  function updateBlock(index: number, patch: Partial<ContentBlock>) {
    setBlocks((cur) => cur.map((b, i) => (i === index ? ({ ...b, ...patch } as ContentBlock) : b)))
  }

  function moveBlock(index: number, dir: -1 | 1) {
    setBlocks((cur) => {
      const target = index + dir
      if (target < 0 || target >= cur.length) return cur
      const next = [...cur]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  function removeBlock(index: number) {
    setBlocks((cur) => (cur.length <= 1 ? cur : cur.filter((_, i) => i !== index)))
  }

  function addBlock(block: ContentBlock) {
    setBlocks((cur) => [...cur, block])
  }

  async function handleBlockImageFile(index: number, file: File) {
    if (!profile) return
    setUploadingBlock(index)
    setError(null)
    const { url, error } = await uploadBlogCover(file, profile.id)
    setUploadingBlock(null)
    if (error) {
      setError(error)
      return
    }
    if (url) updateBlock(index, { src: url } as Partial<ContentBlock>)
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
    const input: BlogPostInput = { ...form, contentBlocks: blocks, content: blocksToPlainText(blocks) }

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
        <Field label="Tiêu đề (không viết hoa toàn bộ, 50-60 ký tự)">
          <input
            required
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full rounded-xl border-2 border-vibe-ink/10 px-3.5 py-2.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <div className="mt-1 text-right">
            <RangeHint value={form.title.length} min={50} max={60} unit="ký tự" />
          </div>
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
            <div className="mt-1 text-right">
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
          <div className="mt-1 text-right">
            <RangeHint value={wordCount(form.excerpt)} min={80} max={100} unit="từ" />
          </div>
        </Field>

        <div>
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-vibe-ink-soft">Nội dung bài viết</span>
          <div className="space-y-3">
            {blocks.map((block, i) => (
              <BlockEditor
                key={i}
                block={block}
                index={i}
                total={blocks.length}
                uploading={uploadingBlock === i}
                onChange={(patch) => updateBlock(i, patch)}
                onMove={(dir) => moveBlock(i, dir)}
                onRemove={() => removeBlock(i)}
                onUploadImage={(file) => handleBlockImageFile(i, file)}
              />
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <AddBlockButton icon={Pilcrow} label="Đoạn văn" onClick={() => addBlock({ type: 'paragraph', text: '' })} />
            <AddBlockButton icon={Heading2} label="Heading 2" onClick={() => addBlock({ type: 'heading2', text: '' })} />
            <AddBlockButton icon={Heading3} label="Heading 3" onClick={() => addBlock({ type: 'heading3', text: '' })} />
            <AddBlockButton icon={ImagePlus} label="Hình ảnh" onClick={() => addBlock({ type: 'image', src: '', alt: '', caption: '' })} />
          </div>
        </div>

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

function AddBlockButton({ icon: Icon, label, onClick }: { icon: typeof Pilcrow; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1.5 rounded-full border-2 border-dashed border-vibe-ink/15 px-3 py-1.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink"
    >
      <Icon size={13} /> {label}
    </button>
  )
}

const BLOCK_LABEL: Record<ContentBlock['type'], string> = {
  paragraph: 'Đoạn văn',
  heading2: 'Heading 2',
  heading3: 'Heading 3',
  image: 'Hình ảnh',
}

function BlockEditor({
  block,
  index,
  total,
  uploading,
  onChange,
  onMove,
  onRemove,
  onUploadImage,
}: {
  block: ContentBlock
  index: number
  total: number
  uploading: boolean
  onChange: (patch: Partial<ContentBlock>) => void
  onMove: (dir: -1 | 1) => void
  onRemove: () => void
  onUploadImage: (file: File) => void
}) {
  return (
    <div className="rounded-xl border-2 border-vibe-ink/10 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-vibe-cream px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-vibe-ink-soft">
          {BLOCK_LABEL[block.type]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(-1)}
            disabled={index === 0}
            className="grid h-6 w-6 place-items-center rounded-md text-vibe-ink-soft hover:bg-vibe-cream disabled:opacity-30"
          >
            <ArrowUp size={13} />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            className="grid h-6 w-6 place-items-center rounded-md text-vibe-ink-soft hover:bg-vibe-cream disabled:opacity-30"
          >
            <ArrowDown size={13} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            disabled={total <= 1}
            className="grid h-6 w-6 place-items-center rounded-md text-vibe-ink-soft hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {block.type === 'image' ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {block.src && <img src={block.src} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />}
            <label className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-vibe-blue/50 bg-vibe-blue/10 py-2.5 text-xs font-semibold text-vibe-blue-dark hover:border-vibe-blue">
              <ImagePlus size={14} /> {uploading ? 'Đang tải...' : block.src ? 'Đổi ảnh' : 'Tải ảnh minh hoạ'}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) onUploadImage(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <input
            value={block.caption ?? ''}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption ảnh (nên chứa từ khoá chính)…"
            className="w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
          />
          <input
            value={block.alt}
            onChange={(e) => onChange({ alt: e.target.value })}
            placeholder="Mô tả ảnh (alt text, cho SEO)…"
            className="w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
          />
        </div>
      ) : (
        <>
          <textarea
            value={block.text}
            onChange={(e) => onChange({ text: e.target.value })}
            rows={block.type === 'paragraph' ? 4 : 1}
            placeholder={
              block.type === 'paragraph'
                ? 'Nội dung đoạn văn — nên chứa từ khoá chính hoặc phụ…'
                : 'Tiêu đề mục — ưu tiên chứa từ khoá chính/phụ…'
            }
            className="w-full resize-y rounded-lg border-2 border-vibe-ink/10 px-3 py-2 text-sm outline-none focus:border-vibe-pink/50"
          />
          {/* Word-count target depends on whether this paragraph sits under an H2-only section
              (tối đa 500 từ) or right before an H3 (150-200 từ) — rather than guessing that
              structurally, just show a plain count so the admin can judge it against whichever
              guidance applies to that spot. */}
          {block.type === 'paragraph' && block.text.trim() && (
            <div className="mt-1 text-right text-[11px] font-medium text-vibe-ink-soft">{wordCount(block.text)} từ</div>
          )}
        </>
      )}
    </div>
  )
}
