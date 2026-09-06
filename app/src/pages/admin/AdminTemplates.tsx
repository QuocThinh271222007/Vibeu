import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pencil, Trash2, Wand2, X } from 'lucide-react'
import { TemplatePreviewMedia } from '@/components/studio/TemplatePreviewMedia'
import { TEMPLATE_TAGS } from '@/data/templateTags'
import { useToast } from '@/components/ui/Toast'
import { deleteTemplate, fetchAllTemplatesAdmin, updateTemplate, uploadTemplateCover, type TemplateRow } from '@/lib/templatesApi'
import { useAuthStore } from '@/store/authStore'
import type { Template } from '@/types/vibeu'

function rowToTemplate(row: TemplateRow): Template {
  return {
    id: row.id,
    name: row.name,
    hashtag: row.hashtag,
    tags: row.tags,
    skinTone: row.skin_tone,
    fingers: row.fingers,
    preview: row.cover_src ? { type: 'curated', image: row.cover_src, alt: row.cover_alt ?? row.name, objectPosition: row.cover_object_position ?? undefined } : undefined,
  }
}

export default function AdminTemplates() {
  const { push } = useToast()
  const [rows, setRows] = useState<TemplateRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TemplateRow | null>(null)

  function reload() {
    setLoading(true)
    fetchAllTemplatesAdmin().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Xoá mẫu "${name}"?`)) return
    const { error } = await deleteTemplate(id)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá mẫu.')
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-vibe-ink">Thư viện mẫu</h1>
          <p className="mt-1 text-sm text-vibe-ink-soft">
            Toàn bộ mẫu hiện có trong Thư viện mẫu. Sửa tên/thẻ/ảnh bìa hoặc xoá tại đây; để tạo mẫu mới, thiết kế trong Studio rồi bấm "Lưu làm mẫu".
          </p>
        </div>
        <Link to="/studio" className="flex items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white">
          <Wand2 size={16} /> Mở Studio
        </Link>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-vibe-ink-soft">Đang tải...</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Chưa có mẫu nào.</p>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {rows.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="aspect-[2/3]">
                <TemplatePreviewMedia template={rowToTemplate(r)} className="h-full w-full" />
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-semibold text-vibe-ink">{r.name}</p>
                <p className="truncate text-xs text-vibe-ink-soft">{r.hashtag}</p>
                <div className="mt-2 flex gap-1.5">
                  <button
                    onClick={() => setEditing(r)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-vibe-cream py-1.5 text-xs font-semibold text-vibe-ink-soft hover:bg-vibe-ink hover:text-white"
                  >
                    <Pencil size={13} /> Sửa
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-full bg-vibe-cream py-1.5 text-xs font-semibold text-vibe-ink-soft hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={13} /> Xoá
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <EditTemplateModal
          row={editing}
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

function EditTemplateModal({ row, onClose, onSaved }: { row: TemplateRow; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const profile = useAuthStore((s) => s.profile)
  const [name, setName] = useState(row.name)
  const [hashtag, setHashtag] = useState(row.hashtag)
  const [tags, setTags] = useState<string[]>(row.tags)
  const [coverSrc, setCoverSrc] = useState<string | null>(row.cover_src)
  const [coverAlt, setCoverAlt] = useState(row.cover_alt ?? '')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  function toggleTag(id: string) {
    setTags((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]))
  }

  async function handleFile(file: File | null) {
    if (!file || !profile) return
    setUploading(true)
    const { url, error } = await uploadTemplateCover(file, profile.id)
    setUploading(false)
    if (error) {
      push('error', error)
      return
    }
    setCoverSrc(url)
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    const { error } = await updateTemplate(row.id, {
      name: name.trim(),
      hashtag,
      tags,
      coverSrc,
      coverAlt: coverSrc ? coverAlt || name.trim() : null,
      coverObjectPosition: coverSrc ? row.cover_object_position : null,
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
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-vibe-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-vibe-ink">Sửa mẫu</p>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft hover:bg-vibe-cream">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 overflow-hidden rounded-xl bg-vibe-cream" style={{ aspectRatio: '2 / 1.4' }}>
          <TemplatePreviewMedia template={rowToTemplate({ ...row, cover_src: coverSrc })} className="h-full w-full" />
        </div>
        <label className="mt-2 block">
          <span className="text-xs font-medium text-vibe-ink-soft">{uploading ? 'Đang tải ảnh...' : 'Đổi ảnh bìa (tuỳ chọn — không chọn thì hiện render trực tiếp)'}</span>
          <input type="file" accept="image/*" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} className="mt-1 w-full text-xs" />
        </label>
        {coverSrc && (
          <button onClick={() => setCoverSrc(null)} className="mt-1 text-xs font-medium text-vibe-ink-soft underline">
            Bỏ ảnh bìa, dùng render trực tiếp
          </button>
        )}

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên mẫu…"
          className="mt-3 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
        />
        <input
          value={hashtag}
          onChange={(e) => setHashtag(e.target.value)}
          placeholder="#Hashtag #ChoMẫu"
          className="mt-2 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
        />
        {coverSrc && (
          <input
            value={coverAlt}
            onChange={(e) => setCoverAlt(e.target.value)}
            placeholder="Mô tả ảnh bìa (alt text)…"
            className="mt-2 w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        )}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {TEMPLATE_TAGS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => toggleTag(t.id)}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                tags.includes(t.id) ? 'border-vibe-pink bg-vibe-pink/10 text-vibe-pink-dark' : 'border-vibe-ink/10 text-vibe-ink-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving || uploading}
            className="rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>
    </div>
  )
}
