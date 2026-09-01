import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Search } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { useStickers, stickerAssetUrl } from '@/data/loaders'
import type { StickerDef } from '@/types/vibeu'

export function CharmsTab({ onAdd }: { onAdd: (stickerId: string, variant: 'flat' | 'color' | '3d') => void }) {
  const { stickers, categories, loading } = useStickers()
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    let list = stickers
    if (category !== 'all') list = list.filter((s) => s.category === category)
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((s) => s.nameVi.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || s.tags.some((t) => t.toLowerCase().includes(q)))
    }
    return list
  }, [stickers, category, query])

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2.5">
        <Search size={16} className="text-vibe-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm charm: hoa, mèo, trái tim…"
          className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
        />
      </label>

      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        <Chip active={category === 'all'} onClick={() => setCategory('all')}>
          Tất cả
        </Chip>
        {categories.map((c) => (
          <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>
            {c.nameVi}
          </Chip>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-5">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="aspect-square animate-pulse rounded-2xl bg-vibe-cream" />
          ))}
        </div>
      ) : (
        <div className="grid max-h-[360px] grid-cols-4 gap-2.5 overflow-y-auto pr-1 vibe-scrollbar sm:grid-cols-5">
          {filtered.map((s) => (
            <StickerButton key={s.id} sticker={s} onAdd={onAdd} />
          ))}
          {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-vibe-ink-soft">Không tìm thấy charm phù hợp.</p>}
        </div>
      )}
    </div>
  )
}

function StickerButton({ sticker, onAdd }: { sticker: StickerDef; onAdd: (id: string, variant: 'flat' | 'color' | '3d') => void }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, rotate: -3 }}
      whileTap={{ scale: 0.92 }}
      onClick={() => onAdd(sticker.id, sticker.defaultVariant)}
      title={sticker.nameVi}
      className="group flex aspect-square flex-col items-center justify-center gap-1 rounded-2xl border-2 border-vibe-ink/5 bg-white p-1.5 shadow-sm transition-colors hover:border-vibe-pink/40"
    >
      <img src={stickerAssetUrl(sticker.variants[sticker.defaultVariant].path)} alt={sticker.nameVi} className="h-full w-full object-contain" draggable={false} />
    </motion.button>
  )
}
