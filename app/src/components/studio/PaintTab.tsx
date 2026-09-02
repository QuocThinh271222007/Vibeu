import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Palette } from 'lucide-react'
import { useColorPresets, colorSwatchUrl } from '@/data/loaders'
import { ColorWheel } from '@/components/studio/ColorWheel'
import { GradientEditor } from '@/components/studio/GradientEditor'
import { MaterialPreview } from '@/components/studio/MaterialPreview'
import type { CustomGradient, EffectId, FingerDesign } from '@/types/vibeu'
import { EFFECT_LABEL_VI } from '@/types/vibeu'

const EFFECTS: EffectId[] = ['gel', 'jelly', 'matte', 'catEye', 'glitter', 'chrome', 'holo']

export function PaintTab({
  design,
  onPreset,
  onEffect,
  onCustomColor,
  onCustomGradient,
}: {
  design: FingerDesign
  onPreset: (id: string, applyToAll: boolean) => void
  onEffect: (e: EffectId) => void
  onCustomColor: (hex: string | null) => void
  onCustomGradient: (g: CustomGradient | null) => void
}) {
  const { presets, loading } = useColorPresets()
  const [applyToAll, setApplyToAll] = useState(false)
  const currentPreset = presets.find((p) => p.id === design.presetId) ?? presets[0]

  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Hiệu ứng màu sơn</p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {EFFECTS.map((e) => {
            const active = design.effect === e
            return (
              <button
                key={e}
                onClick={() => onEffect(e)}
                aria-pressed={active}
                className={`group flex flex-col items-center gap-1.5 rounded-2xl border-2 p-1.5 pb-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibe-blue-dark focus-visible:ring-offset-2 ${
                  active ? 'border-vibe-blue-dark bg-vibe-blue/15' : 'border-vibe-ink/10 bg-white hover:border-vibe-blue/30'
                }`}
              >
                <MaterialPreview
                  effect={e}
                  className={`aspect-square w-full ring-1 ring-inset transition-shadow ${active ? 'ring-vibe-blue-dark/40' : 'ring-black/5 group-hover:ring-vibe-blue/30'}`}
                />
                <span className={`text-[11px] font-semibold ${active ? 'text-vibe-ink' : 'text-vibe-ink-soft'}`}>{EFFECT_LABEL_VI[e]}</span>
              </button>
            )
          })}
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

      {currentPreset && (
        <GradientEditor
          gradient={design.customGradient}
          fallback={currentPreset.paint}
          onChange={onCustomGradient}
        />
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-vibe-ink">
            <Palette size={15} /> Tùy chỉnh riêng
          </p>
          {design.customColor && (
            <button onClick={() => onCustomColor(null)} className="text-xs font-semibold text-vibe-pink-dark underline-offset-2 hover:underline">
              Xoá
            </button>
          )}
        </div>
        <div className="flex flex-col items-center gap-2">
          <ColorWheel value={design.customColor ?? '#FF92F9'} onChange={onCustomColor} />
          <div className="text-xs text-vibe-ink-soft">
            {design.customColor ? (
              <>
                Màu tùy chỉnh: <span className="font-semibold text-vibe-ink">{design.customColor}</span>
              </>
            ) : (
              'Chọn để ghi đè màu preset cho ngón này'
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
