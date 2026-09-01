import { motion } from 'framer-motion'
import { FINGER_LABEL_VI, FINGER_ORDER, type FingerDesign, type FingerId } from '@/types/vibeu'
import type { ColorPreset } from '@/types/vibeu'

export function FingerSelector({
  fingers,
  selected,
  onSelect,
  presetsById,
}: {
  fingers: Record<FingerId, FingerDesign>
  selected: FingerId
  onSelect: (f: FingerId) => void
  presetsById: Record<string, ColorPreset>
}) {
  return (
    <div className="mx-auto flex max-w-md items-center justify-between gap-2 px-1">
      {FINGER_ORDER.map((f) => {
        const design = fingers[f]
        const preset = presetsById[design.presetId]
        const color = design.customColor ?? preset?.paint.color ?? '#eee'
        const active = f === selected
        return (
          <button key={f} onClick={() => onSelect(f)} className="flex flex-col items-center gap-1.5">
            <motion.span
              animate={{ scale: active ? 1.15 : 1, y: active ? -2 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              className="relative grid h-9 w-9 place-items-center rounded-full border-2 shadow-sm"
              style={{ background: color, borderColor: active ? 'var(--color-vibe-pink-dark)' : 'rgba(0,0,0,0.08)' }}
            >
              {design.stickers.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid h-3.5 w-3.5 place-items-center rounded-full bg-white text-[8px] font-bold text-vibe-ink shadow">
                  {design.stickers.length}
                </span>
              )}
            </motion.span>
            <span className={`text-[11px] font-medium ${active ? 'text-vibe-ink' : 'text-vibe-ink-soft'}`}>
              {FINGER_LABEL_VI[f].replace('Ngón ', '')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
