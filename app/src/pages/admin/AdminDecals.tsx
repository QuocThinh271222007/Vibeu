import { useEffect, useMemo, useState } from 'react'
import { FolderCog, Pencil, Plus, Search, Trash2, Upload, X } from 'lucide-react'
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
import {
  createDecalCategory,
  deleteDecalCategory,
  fetchAllDecalCategories,
  updateDecalCategory,
  type DecalCategoryRow,
} from '@/lib/decalCategoriesApi'
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
  const [categoryRows, setCategoryRows] = useState<DecalCategoryRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState<'all' | 'standard' | 'premium'>('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editing, setEditing] = useState<DecalRow | 'new' | null>(null)
  const [managingCategories, setManagingCategories] = useState(false)

  function reload() {
    setLoading(true)
    Promise.all([fetchAllDecalsAdmin(), fetchAllDecalCategories()]).then(([decals, categories]) => {
      setRows(decals)
      setCategoryRows(categories)
      setLoading(false)
    })
  }

  useEffect(reload, [])

  const categoryCount = useMemo(() => {
    const counts = new Map<string, number>()
    for (const r of rows) counts.set(r.category, (counts.get(r.category) ?? 0) + 1)
    return counts
  }, [rows])

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
        <div className="flex shrink-0 gap-2">
          <button
            onClick={() => setManagingCategories(true)}
            className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-4 py-2 text-sm font-semibold text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink"
          >
            <FolderCog size={16} /> Quản lý danh mục
          </button>
          <button
            onClick={() => setEditing('new')}
            className="flex items-center gap-1.5 rounded-full bg-vibe-ink px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Decal mới
          </button>
        </div>
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
          {categoryRows.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_vi}
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
          categoryRows={categoryRows}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            void invalidateDecals()
            reload()
          }}
        />
      )}

      {managingCategories && (
        <CategoryManagerModal
          categoryRows={categoryRows}
          categoryCount={categoryCount}
          onClose={() => setManagingCategories(false)}
          onChanged={() => {
            void invalidateDecals()
            reload()
          }}
        />
      )}
    </div>
  )
}

function CategoryManagerModal({
  categoryRows,
  categoryCount,
  onClose,
  onChanged,
}: {
  categoryRows: DecalCategoryRow[]
  categoryCount: Map<string, number>
  onClose: () => void
  onChanged: () => void
}) {
  const { push } = useToast()
  const [newName, setNewName] = useState('')
  const [renaming, setRenaming] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!newName.trim()) return
    const id = slugify(newName)
    setCreating(true)
    const { error } = await createDecalCategory(id, newName.trim())
    setCreating(false)
    if (error) {
      push('error', error)
      return
    }
    setNewName('')
    push('success', 'Đã tạo danh mục.')
    onChanged()
  }

  async function handleRename(row: DecalCategoryRow) {
    const nextName = (renaming[row.id] ?? row.name_vi).trim()
    if (!nextName || nextName === row.name_vi) return
    setBusyId(row.id)
    const { error } = await updateDecalCategory(row.id, nextName)
    setBusyId(null)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã đổi tên danh mục — mọi decal đang dùng đã cập nhật theo.')
    onChanged()
  }

  async function handleDelete(row: DecalCategoryRow) {
    const count = categoryCount.get(row.id) ?? 0
    const warning = count > 0 ? ` ${count} decal đang dùng danh mục này sẽ vẫn giữ nguyên nhãn "${row.name_vi}" cho tới khi bạn sửa lại.` : ''
    if (!confirm(`Xoá danh mục "${row.name_vi}"?${warning}`)) return
    setBusyId(row.id)
    const { error } = await deleteDecalCategory(row.id)
    setBusyId(null)
    if (error) {
      push('error', error)
      return
    }
    push('success', 'Đã xoá danh mục.')
    onChanged()
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/40 p-4" onClick={onClose}>
      <div className="my-8 w-full max-w-md rounded-2xl bg-white p-5 shadow-vibe-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <p className="font-display text-base font-semibold text-vibe-ink">Quản lý danh mục Charm/Decal</p>
          <button onClick={onClose} className="grid h-8 w-8 place-items-center rounded-full text-vibe-ink-soft hover:bg-vibe-cream">
            <X size={16} />
          </button>
        </div>

        <div className="mt-3 flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Tên danh mục mới…"
            className="w-full rounded-full border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
          />
          <button
            onClick={handleCreate}
            disabled={!newName.trim() || creating}
            className="shrink-0 rounded-full bg-vibe-ink px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
          >
            {creating ? 'Đang tạo...' : 'Thêm'}
          </button>
        </div>

        <div className="mt-4 max-h-80 space-y-1.5 overflow-y-auto">
          {categoryRows.map((c) => (
            <div key={c.id} className="flex items-center gap-1.5 rounded-xl border-2 border-vibe-ink/10 p-2">
              <input
                value={renaming[c.id] ?? c.name_vi}
                onChange={(e) => setRenaming((r) => ({ ...r, [c.id]: e.target.value }))}
                className="w-full rounded-lg border-0 bg-transparent px-1.5 py-1 text-sm outline-none focus:bg-vibe-cream"
              />
              <span className="shrink-0 text-[11px] text-vibe-ink-soft">{categoryCount.get(c.id) ?? 0} decal</span>
              <button
                onClick={() => handleRename(c)}
                disabled={busyId === c.id || (renaming[c.id] ?? c.name_vi) === c.name_vi}
                title="Lưu tên mới"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-vibe-ink-soft hover:bg-vibe-cream hover:text-vibe-ink disabled:opacity-30"
              >
                <Pencil size={13} />
              </button>
              <button
                onClick={() => handleDelete(c)}
                disabled={busyId === c.id}
                title="Xoá danh mục"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-vibe-ink-soft hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          {categoryRows.length === 0 && <p className="py-4 text-center text-sm text-vibe-ink-soft">Chưa có danh mục nào.</p>}
        </div>
      </div>
    </div>
  )
}

function EditDecalModal({
  row,
  categoryRows,
  onClose,
  onSaved,
}: {
  row: DecalRow | null
  categoryRows: DecalCategoryRow[]
  onClose: () => void
  onSaved: () => void
}) {
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

          <label className="col-span-2 block">
            <span className="text-xs font-medium text-vibe-ink-soft">Danh mục *</span>
            <select
              value={form.category}
              onChange={(e) => {
                const chosen = categoryRows.find((c) => c.id === e.target.value)
                setForm((f) => ({ ...f, category: e.target.value, categoryVi: chosen?.name_vi ?? f.categoryVi }))
              }}
              className="mt-1 w-full rounded-lg border-2 border-vibe-ink/10 px-3 py-1.5 text-sm outline-none focus:border-vibe-pink/50"
            >
              <option value="" disabled>
                Chọn danh mục…
              </option>
              {categoryRows.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_vi}
                </option>
              ))}
            </select>
            {categoryRows.length === 0 && (
              <p className="mt-1 text-[11px] text-amber-600">Chưa có danh mục nào — bấm "Quản lý danh mục" ở trang danh sách để tạo trước.</p>
            )}
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
