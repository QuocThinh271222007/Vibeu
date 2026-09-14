import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
import { resolveDecalPath } from '@/data/loaders'
import { invalidateDecals } from '@/data/decals'
import { useToast } from '@/components/ui/Toast'
import {
  createDecal,
  decalIdExists,
  deleteDecal,
  fetchAllDecalsAdmin,
  updateDecal,
  uploadDecalAsset,
  type DecalInput,
  type DecalRow,
} from '@/lib/decalsApi'
import { slugify } from '@/lib/slug'
import { useAuthStore } from '@/store/authStore'
import type { DecalLayerType } from '@/types/vibeu'

const LAYER_TYPES: DecalLayerType[] = ['decal', 'foil', 'raised']
const LAYER_LABEL: Record<DecalLayerType, string> = { decal: 'Decal phẳng', foil: 'Foil', raised: 'Charm nổi (raised)' }

function rowToInput(row: DecalRow): DecalInput {
  return {
    id: row.id,
    name: row.name,
    nameVi: row.name_vi,
    category: row.category,
    categoryVi: row.category_vi,
    tags: row.tags,
    path: row.path,
    thumbnail: row.thumbnail,
    viewBoxW: row.view_box_w,
    viewBoxH: row.view_box_h,
    contentBounds: row.content_bounds,
    defaultScale: row.default_scale,
    tintable: row.tintable,
    layerType: row.layer_type,
    style: row.style,
    source: row.source,
    license: row.license,
    tier: row.tier,
  }
}

const EMPTY_INPUT: DecalInput = {
  id: '',
  name: '',
  nameVi: '',
  category: '',
  categoryVi: '',
  tags: [],
  path: '',
  thumbnail: null,
  viewBoxW: 100,
  viewBoxH: 100,
  contentBounds: [0, 0, 1, 1],
  defaultScale: 0.6,
  tintable: false,
  layerType: 'decal',
  style: null,
  source: '',
  license: '',
  tier: 'standard',
}

export default function AdminDecals() {
  const { push } = useToast()
  const [rows, setRows] = useState<DecalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'standard' | 'premium'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<DecalRow | 'new' | null>(null)

  function reload() {
    setLoading(true)
    fetchAllDecalsAdmin().then((data) => {
      setRows(data)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const categories = useMemo(() => [...new Set(rows.map((r) => r.category))].sort(), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (tierFilter !== 'all' && r.tier !== tierFilter) return false
      if (categoryFilter !== 'all' && r.category !== categoryFilter) return false
      if (q && !`${r.name} ${r.name_vi} ${r.id} ${r.tags.join(' ')}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, search, tierFilter, categoryFilter])

  async function handleDelete(row: DecalRow) {
    if (!confirm(`Xoá decal "${row.name_vi}"? Thiết kế cũ đã dùng decal này sẽ hiện thiếu ảnh.`)) return
    const { error } = await deleteDecal(row.id)
    if (error) {
      push('error', error)
      return
    }
    void invalidateDecals()
    push('success', 'Đã xoá decal.')
    reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-vibe-ink">Charm & Decal</h1>
          <p className="mt-1 text-sm text-vibe-ink-soft">
            Toàn bộ thư viện sticker/charm trong Nail Studio ({rows.length} decal) — thêm/sửa/xoá tại đây, có hiệu lực ngay không cần deploy.
          </p>
        </div>
        <button
          onClick={() => setEditing('new')}
          className="flex shrink-0 items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus size={16} /> Decal mới
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-vibe-ink-soft" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên, id, tag…"
            className="w-full rounded-full border-2 border-vibe-ink/10 py-2 pl-9 pr-3.5 text-sm outline-none focus:border-vibe-pink/50"
          />
        </div>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
          className="rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm outline-none focus:border-vibe-pink/50"
        >
          <option value="all">Mọi tier</option>
          <option value="standard">Standard</option>
          <option value="premium">Premium</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm outline-none focus:border-vibe-pink/50"
        >
          <option value="all">Mọi danh mục</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-vibe-ink-soft">Đang tải...</p>
      ) : filtered.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-6 text-center text-sm text-vibe-ink-soft shadow-sm">Không tìm thấy decal nào.</p>
      ) : (
        <>
          <p className="mt-4 text-xs text-vibe-ink-soft">Hiện {filtered.length} / {rows.length} decal.</p>
          <div className="mt-2 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {filtered.map((r) => (
              <div key={r.id} className="overflow-hidden rounded-2xl bg-white shadow-sm">
                <div className="grid aspect-square place-items-center bg-vibe-cream p-3">
                  <img src={resolveDecalPath(r.thumbnail ?? r.path)} alt={r.name_vi} className="h-full w-full object-contain" loading="lazy" />
                </div>
                <div className="p-2">
                  <p className="truncate text-[11px] font-semibold text-vibe-ink" title={r.name_vi}>
                    {r.name_vi}
                  </p>
                  <p className="truncate text-[10px] text-vibe-ink-soft">{r.tier === 'premium' ? 'Premium' : 'Standard'}</p>
                  <div className="mt-1.5 flex gap-1">
                    <button
                      onClick={() => setEditing(r)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-vibe-cream py-1 text-[10px] font-semibold text-vibe-ink-soft hover:bg-vibe-ink hover:text-white"
                    >
                      <Pencil size={11} />
                    </button>
                    <button
                      onClick={() => handleDelete(r)}
                      className="flex flex-1 items-center justify-center gap-1 rounded-full bg-vibe-cream py-1 text-[10px] font-semibold text-vibe-ink-soft hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {editing && (
        <EditDecalModal
          row={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void invalidateDecals()
            reload()
          }}
        />
      )}
    </div>
  )
}

function EditDecalModal({ row, onClose, onSaved }: { row: DecalRow | null; onClose: () => void; onSaved: () => void }) {
  const { push } = useToast()
  const profile = useAuthStore((s) => s.profile)
  const [form, setForm] = useState<DecalInput>(row ? rowToInput(row) : EMPTY_INPUT)
  const [idTouched, setIdTouched] = useState(Boolean(row))
  const [tagsText, setTagsText] = useState(row ? row.tags.join(', ') : '')
  const [uploadingPath, setUploadingPath] = useState(false)
  const [uploadingThumb, setUploadingThumb] = useState(false)
  const [saving, setSaving] = useState(false)

  function handleNameChange(v: string) {
    setForm((f) => ({ ...f, nameVi: v, name: f.name || v }))
    if (!idTouched) setForm((f) => ({ ...f, id: slugify(v) }))
  }

  async function handleUpload(kind: 'path' | 'thumbnail', file: File | null) {
    if (!file || !profile) return
    const setUploading = kind === 'path' ? setUploadingPath : setUploadingThumb
    setUploading(true)
    const { url, error } = await uploadDecalAsset(file, profile.id)
    setUploading(false)
    if (error) {
      push('error', error)
      return
    }
    setForm((f) => ({ ...f, [kind]: url }))
  }

  async function handleSave() {
    if (!form.id.trim() || !form.nameVi.trim() || !form.path.trim() || !form.category.trim()) {
      push('error', 'Cần có ít nhất: id, tên, danh mục và đường dẫn ảnh.')
      return
    }
    setSaving(true)
    const input: DecalInput = {
      ...form,
      id: slugify(form.id),
      name: form.name.trim() || form.nameVi.trim(),
      categoryVi: form.categoryVi.trim() || form.category.trim(),
      tags: tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
    }
    if (!row) {
      const exists = await decalIdExists(input.id)
      if (exists) {
        setSaving(false)
        push('error', `Id "${input.id}" đã tồn tại, hãy đổi tên hoặc sửa id.`)
        return
      }
    }
    const { error } = row ? await updateDecal(row.id, input) : await createDecal(input, profile!.id)
    setSaving(false)
    if (error) {
      push('error', error)
      return
    }
    push('success', row ? 'Đã lưu thay đổi.' : 'Đã tạo decal.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div
        className="my-8 w-full max-w-lg rounded-2xl bg-white p-5 shadow-vibe-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-vibe-ink">{row ? 'Sửa decal' : 'Decal mới'}</p>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft hover:bg-vibe-cream">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {form.path && (
            <div className="col-span-2 grid aspect-[3/1] place-items-center rounded-xl bg-vibe-cream">
              <img src={resolveDecalPath(form.thumbnail || form.path)} alt="" className="h-full max-h-28 object-contain" />
            </div>
          )}
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">{uploadingPath ? 'Đang tải...' : 'Ảnh decal (SVG/PNG/WebP) *'}</span>
            <div className="mt-1 flex gap-2">
              <input
                value={form.path}
                onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))}
                placeholder="svg/... hoặc https://..."
                className="w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-2 border-vibe-ink/10 px-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40">
                <Upload size={13} />
                <input type="file" accept="image/svg+xml,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload('path', e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </label>
          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">{uploadingThumb ? 'Đang tải...' : 'Ảnh thu nhỏ (tuỳ chọn, để trống dùng ảnh chính)'}</span>
            <div className="mt-1 flex gap-2">
              <input
                value={form.thumbnail ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value || null }))}
                className="w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
              />
              <label className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg border-2 border-vibe-ink/10 px-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40">
                <Upload size={13} />
                <input type="file" accept="image/svg+xml,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleUpload('thumbnail', e.target.files?.[0] ?? null)} />
              </label>
            </div>
          </label>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tên (tiếng Việt) *</span>
            <input
              value={form.nameVi}
              onChange={(e) => handleNameChange(e.target.value)}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tên (English)</span>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Id (slug, duy nhất)</span>
            <input
              value={form.id}
              disabled={Boolean(row)}
              onChange={(e) => {
                setIdTouched(true)
                setForm((f) => ({ ...f, id: slugify(e.target.value) }))
              }}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50 disabled:bg-vibe-cream disabled:text-vibe-ink-soft"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Danh mục (id, vd: floral) *</span>
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: slugify(e.target.value) }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tên danh mục (VI)</span>
            <input
              value={form.categoryVi}
              onChange={(e) => setForm((f) => ({ ...f, categoryVi: e.target.value }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tags (cách nhau bởi dấu phẩy)</span>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="flower, daisy, floral"
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>

          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Kiểu lớp</span>
            <select
              value={form.layerType}
              onChange={(e) => setForm((f) => ({ ...f, layerType: e.target.value as DecalLayerType }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            >
              {LAYER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LAYER_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tier</span>
            <select
              value={form.tier}
              onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value as 'standard' | 'premium' }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </label>

          <label className="flex items-center gap-2 text-sm font-medium text-vibe-ink">
            <input
              type="checkbox"
              checked={form.tintable}
              onChange={(e) => setForm((f) => ({ ...f, tintable: e.target.checked }))}
              className="h-4 w-4 rounded border-2 border-vibe-ink/20"
            />
            Cho phép đổi màu (line-art)
          </label>
          <label className="block">
            <span className="text-xs font-medium text-vibe-ink-soft">Tỉ lệ mặc định</span>
            <input
              type="number"
              step="0.05"
              min={0.1}
              max={2}
              value={form.defaultScale}
              onChange={(e) => setForm((f) => ({ ...f, defaultScale: Number(e.target.value) || 0.6 }))}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">Nguồn gốc / bản quyền</span>
            <input
              value={form.source}
              onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}
              placeholder="Nguồn ảnh…"
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>
          <label className="col-span-2 block">
            <input
              value={form.license}
              onChange={(e) => setForm((f) => ({ ...f, license: e.target.value }))}
              placeholder="Giấy phép sử dụng…"
              className="w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-3.5 py-1.5 text-xs font-semibold text-vibe-ink-soft">
            Huỷ
          </button>
          <button
            onClick={handleSave}
            disabled={saving || uploadingPath || uploadingThumb}
            className="rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {saving ? 'Đang lưu...' : row ? 'Lưu thay đổi' : 'Tạo decal'}
          </button>
        </div>
      </div>
    </div>
  )
}
