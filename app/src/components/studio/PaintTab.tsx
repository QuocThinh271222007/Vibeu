import { useState } from 'react'
import { motion } from 'framer-motion'
import { Check, Palette } from 'lucide-react'
import { useColorPresets, colorSwatchUrl } from '@/data/loaders'
import { ColorWheel } from '@/components/studio/ColorWheel'
import { GradientEditor } from '@/components/studio/GradientEditor'
import { HexColorInput } from '@/components/studio/HexColorInput'
import { MaterialPreview } from '@/components/studio/MaterialPreview'
import type { CustomGradient, EffectId, FingerDesign } from '@/types/vibeu'
import { EFFECT_LABEL_VI } from '@/types/vibeu'

const EFFECTS: EffectId[] = ['gel', 'jelly', 'clear', 'matte', 'catEye', 'glitter', 'chrome', 'holo', 'glazed', 'velvet']

export function PaintTab({
  design,
  onPreset,
  onEffect,
  onCustomColor,
  onCustomGradient,
}: {
  design: FingerDesign
  onPreset: (id: string, applyToAll: boolean) => void
  onEffect: (e: EffectId, applyToAll: boolean) => void
  onCustomColor: (hex: string | null, applyToAll: boolean) => void
  onCustomGradient: (g: CustomGradient | null, applyToAll: boolean) => void
}) {
  const { presets, loading } = useColorPresets()
  const [applyToAll, setApplyToAll] = useState(false)
  const currentPreset = presets.find((p) => p.id === design.presetId) ?? presets[0]

  return (
    <div className="space-y-7">
      <label className="flex items-center gap-1.5 rounded-2xl bg-vibe-cream/60 px-3.5 py-2.5 text-xs font-semibold text-vibe-ink-soft">
        <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="accent-vibe-pink-dark" />
        Sơn cả 5 ngón cùng lúc
      </label>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Hiệu ứng màu sơn</p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          {EFFECTS.map((e) => {
            const active = design.effect === e
            return (
              <button
                key={e}
                onClick={() => onEffect(e, applyToAll)}
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

      <div className="space-y-3 rounded-2xl border-2 border-vibe-blue/30 bg-vibe-blue/5 p-3.5">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-vibe-ink">
            <Palette size={15} /> Màu đơn
          </p>
          {design.customColor && (
            <button onClick={() => onCustomColor(null, applyToAll)} className="text-[11px] font-semibold text-vibe-pink-dark hover:underline">
              Dùng bảng phối màu
            </button>
          )}
        </div>
        <p className="text-[11px] text-vibe-ink-soft">Một màu duy nhất, phủ đều cả móng — tách riêng khỏi các gradient/hoạ tiết bên dưới.</p>
        <div className="flex flex-col items-center gap-2">
          <ColorWheel value={design.customColor ?? '#FF92F9'} onChange={(hex) => onCustomColor(hex, applyToAll)} />
          <HexColorInput value={design.customColor ?? '#FF92F9'} onChange={(hex) => onCustomColor(hex, applyToAll)} />
          {design.customColor && (
            <div className="text-xs text-vibe-ink-soft">
              Màu hiện tại: <span className="font-semibold text-vibe-ink">{design.customColor}</span>
            </div>
          )}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Bảng phối màu ({presets.length})</p>

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
          onChange={(g) => onCustomGradient(g, applyToAll)}
        />
      )}
    </div>
  )
}
