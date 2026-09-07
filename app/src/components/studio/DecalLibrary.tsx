import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Sparkles, Upload } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { ScrollableRow } from '@/components/ui/ScrollableRow'
import { useDecals, resolveDecalPath } from '@/data/loaders'
import { registerUploadedDecal } from '@/lib/decalCache'
import { useStudioStore } from '@/store/studioStore'
import type { DecalAsset } from '@/types/vibeu'

type TierFilter = 'all' | 'premium' | 'standard'
type KindFilter = 'all' | 'sticker' | 'charm'

/** `layerType: 'raised'` IS the charm/object distinction (dome-shaded, unclipped overlay —
 * see composeCharmLayer in nailFill.ts); 'decal'/'foil' are flat surface stickers. This is
 * just a friendlier name for the UI, not a second source of truth. */
function assetKind(d: DecalAsset): KindFilter {
  return d.layerType === 'raised' ? 'charm' : 'sticker'
}

export function DecalLibrary({ onAdd }: { onAdd: (decalId: string, applyToAll: boolean) => void }) {
  const { decals, categories, loading } = useDecals()
  const customDecals = useStudioStore((s) => s.customDecals)
  const addCustomDecal = useStudioStore((s) => s.addCustomDecal)
  const [category, setCategory] = useState<string>('all')
  const [tier, setTier] = useState<TierFilter>('all')
  const [kind, setKind] = useState<KindFilter>('all')
  const [query, setQuery] = useState('')
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [applyToAll, setApplyToAll] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const allDecals = useMemo(() => [...decals, ...customDecals], [decals, customDecals])
  const allCategories = useMemo(
    () => (customDecals.length ? [...categories, { id: 'custom', nameVi: 'Tải lên', count: customDecals.length }] : categories),
    [categories, customDecals.length],
  )
  const hasPremium = useMemo(() => decals.some((d) => d.tier === 'premium'), [decals])
  const hasCharms = useMemo(() => allDecals.some((d) => assetKind(d) === 'charm'), [allDecals])

  const filtered = useMemo(() => {
    let list = allDecals
    if (kind !== 'all') list = list.filter((d) => assetKind(d) === kind)
    if (tier !== 'all') list = list.filter((d) => (tier === 'premium' ? d.tier === 'premium' : d.tier !== 'premium'))
    if (category !== 'all') list = list.filter((d) => d.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((d) => d.nameVi.toLowerCase().includes(q) || d.name.toLowerCase().includes(q) || d.tags.some((t) => t.toLowerCase().includes(q)))
    }
    return list
  }, [allDecals, kind, tier, category, query])

  async function handleUpload(files: FileList | null) {
    if (!files || !files.length) return
    setUploadError(null)
    for (const file of Array.from(files)) {
      try {
        const asset = await registerUploadedDecal(file)
        addCustomDecal(asset)
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : 'Không thể tải ảnh lên.')
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-1.5 rounded-2xl bg-vibe-cream/60 px-3.5 py-2.5 text-xs font-semibold text-vibe-ink-soft">
        <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="accent-vibe-pink-dark" />
        Gắn cả 5 ngón cùng lúc
      </label>

      <label className="flex items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2.5">
        <Search size={16} className="text-vibe-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm decal: hoa, bướm, nơ, ngôi sao…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
        />
      </label>

      {hasCharms && (
        <div className="space-y-1.5">
          <div className="flex gap-2">
            <Chip active={kind === 'all'} onClick={() => setKind('all')}>
              Tất cả
            </Chip>
            <Chip active={kind === 'sticker'} onClick={() => setKind('sticker')}>
              Sticker
            </Chip>
            <Chip active={kind === 'charm'} onClick={() => setKind('charm')}>
              Charm
            </Chip>
          </div>
          {kind !== 'all' && (
            <p className="text-[11px] text-vibe-ink-soft">
              {kind === 'sticker' ? 'Sticker: dán phẳng trên móng.' : 'Charm: phụ kiện nổi 2.5D, có thể đặt trên móng hoặc quanh ngón.'}
            </p>
          )}
        </div>
      )}

      {hasPremium && (
        <div className="flex gap-2">
          <Chip active={tier === 'all'} onClick={() => setTier('all')}>
            Tất cả
          </Chip>
          <Chip active={tier === 'premium'} onClick={() => setTier('premium')}>
            <span className="inline-flex items-center gap-1">
              <Sparkles size={12} /> Premium
            </span>
          </Chip>
          <Chip active={tier === 'standard'} onClick={() => setTier('standard')}>
            Cơ bản
          </Chip>
        </div>
      )}

      <ScrollableRow className="flex gap-2 pb-1">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          Tất cả danh mục
        </Chip>
        {allCategories.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.nameVi}
          </Chip>
        ))}
      </ScrollableRow>

      <div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/webp,image/jpeg,image/svg+xml"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-vibe-ink/15 py-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-pink/40 hover:text-vibe-ink"
        >
          <Upload size={14} /> Tải ảnh decal riêng (PNG/WebP/JPEG/SVG, tối đa 6MB)
        </button>
        {uploadError && <p className="mt-1.5 text-[11px] text-red-500">{uploadError}</p>}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-vibe-cream" />
          ))}
        </div>
      ) : (
        <div className="grid max-h-[420px] grid-cols-4 gap-2.5 overflow-y-auto pr-1 vibe-scrollbar sm:grid-cols-5">
          {filtered.map((d) => (
            <DecalButton key={d.id} decal={d} onAdd={(id) => onAdd(id, applyToAll)} />
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-vibe-ink-soft">Không tìm thấy decal phù hợp.</p>}
        </div>
      )}
    </div>
  )
}

function DecalButton({ decal, onAdd }: { decal: DecalAsset; onAdd: (id: string) => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, rotate: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onAdd(decal.id)}
      title={decal.nameVi}
      className="group relative flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-vibe-ink/5 bg-white p-1.5 shadow-sm transition-colors hover:border-vibe-pink/40"
    >
      {decal.tier === 'premium' && (
        <span className="absolute right-1 top-1 grid h-4 w-4 place-items-center rounded-full bg-vibe-pink-dark text-white">
          <Sparkles size={9} />
        </span>
      )}
      {decal.layerType === 'raised' && (
        <span className="absolute left-1 top-1 rounded-full bg-vibe-blue-dark/90 px-1.5 py-0.5 text-[8px] font-bold leading-none text-white">Charm</span>
      )}
      <img src={resolveDecalPath(decal.thumbnail ?? decal.path)} alt={decal.nameVi} className="h-full w-full object-contain" draggable={false} loading="lazy" />
    </motion.button>
  )
}
