import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Palette } from 'lucide-react'
import { useColorPresets, colorSwatchUrl } from '@/data/loaders'
import type { EffectId, FingerDesign } from '@/types/vibeu'
import { EFFECT_LABEL_VI } from '@/types/vibeu'

const EFFECTS: EffectId[] = ['gel', 'jelly', 'catEye', 'chrome']

export function PaintTab({
  design,
  onPreset,
  onEffect,
  onCustomColor,
}: {
  design: FingerDesign
  onPreset: (id: string, applyToAll: boolean) => void
  onEffect: (e: EffectId) => void
  onCustomColor: (hex: string | null) => void
}) {
  const { presets, loading } = useColorPresets()
  const [applyToAll, setApplyToAll] = useState(false)

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Hiệu ứng màu sơn</p>
        <div className="grid grid-cols-4 gap-2">
          {EFFECTS.map((e) => (
            <button
              key={e}
              onClick={() => onEffect(e)}
              className={`rounded-2xl border-2 py-2.5 text-[11px] font-semibold transition-colors ${
                design.effect === e ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 bg-white text-vibe-ink-soft hover:border-vibe-blue/30'
              }`}
            >
              {EFFECT_LABEL_VI[e]}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-vibe-ink">Bảng phối màu ({presets.length})</p>
          <label className="flex items-center gap-1.5 text-xs text-vibe-ink-soft">
            <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="accent-vibe-pink-dark" />
            Áp dụng cả 5 ngón
          </label>
        </div>

        {loading ? (
          <div className="grid grid-cols-5 gap-2.5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-vibe-cream" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-2.5">
            {presets.map((p) => {
              const active = design.presetId === p.id && !design.customColor
              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => onPreset(p.id, applyToAll)}
                  title={p.name}
                  className={`relative aspect-square overflow-hidden rounded-xl border-2 transition-shadow ${
                    active ? 'border-vibe-pink-dark shadow-vibe' : 'border-white/60 hover:border-vibe-pink/40'
                  }`}
                >
                  <img src={colorSwatchUrl(p.swatch.png)} alt={p.name} className="h-full w-full object-cover" draggable={false} />
                  {active && (
                    <span className="absolute inset-0 grid place-items-center bg-black/10">
                      <Check size={16} className="text-white drop-shadow" />
                    </span>
                  )}
                </motion.button>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-vibe-ink">
          <Palette size={15} /> Tùy chỉnh riêng
        </p>
        <div className="flex items-center gap-3">
          <label className="relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full border-2 border-vibe-ink/10 shadow-sm">
            <input
              type="color"
              value={design.customColor ?? '#FF92F9'}
              onChange={(e) => onCustomColor(e.target.value)}
              className="absolute -left-2 -top-2 h-16 w-16 cursor-pointer"
            />
          </label>
          <div className="text-xs text-vibe-ink-soft">
            {design.customColor ? (
              <>
                Màu tùy chỉnh: <span className="font-semibold text-vibe-ink">{design.customColor}</span>
              </>
            ) : (
              'Chọn để ghi đè màu preset cho ngón này'
            )}
          </div>
          {design.customColor && (
            <button onClick={() => onCustomColor(null)} className="ml-auto text-xs font-semibold text-vibe-pink-dark underline-offset-2 hover:underline">
              Xoá
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
