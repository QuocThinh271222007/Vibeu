import { motion } from 'framer-motion'
import type { FingerDesign, NailLength, NailShape } from '@/types/vibeu'
import { SHAPE_LABEL_VI } from '@/types/vibeu'

const SHAPES: NailShape[] = ['oval', 'square', 'coffin', 'almond']
const LENGTHS: NailLength[] = ['S', 'M', 'L']

export function ShapeLengthTab({
  design,
  onShape,
  onLength,
}: {
  design: FingerDesign
  onShape: (s: NailShape) => void
  onLength: (l: NailLength) => void
}) {
  return (
    <div className="space-y-7">
      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Form móng</p>
        <div className="grid grid-cols-4 gap-2.5">
          {SHAPES.map((s) => (
            <button
              key={s}
              onClick={() => onShape(s)}
              className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 py-3 transition-colors ${
                design.shape === s ? 'border-vibe-pink-dark bg-vibe-pink/10' : 'border-vibe-ink/10 bg-white hover:border-vibe-pink/30'
              }`}
            >
              <ShapeIcon shape={s} active={design.shape === s} />
              <span className="text-[11px] font-medium text-vibe-ink">{SHAPE_LABEL_VI[s]}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Độ dài</p>
        <div className="relative flex rounded-full bg-vibe-cream p-1">
          {LENGTHS.map((l) => (
            <button key={l} onClick={() => onLength(l)} className="relative z-10 flex-1 py-2.5 text-sm font-semibold">
              {design.length === l && (
                <motion.span
                  layoutId="length-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={design.length === l ? 'text-vibe-ink' : 'text-vibe-ink-soft'}>{l}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-vibe-ink-soft">S = ngắn gọn · M = vừa vặn · L = dài nổi bật</p>
      </div>
    </div>
  )
}

function ShapeIcon({ shape, active }: { shape: NailShape; active: boolean }) {
  const color = active ? '#e564dd' : '#a89ecf'
  const paths: Record<NailShape, string> = {
    oval: 'M9 3C13 3 15 8 15 13C15 18 12 20 9 20C6 20 3 18 3 13C3 8 5 3 9 3Z',
    square: 'M4 3H14V13C14 18 11 20 9 20C7 20 4 18 4 13V3Z',
    coffin: 'M5 3H13L14 13C14 17 12 20 9 20C6 20 4 17 4 13L5 3Z',
    almond: 'M9 2C13 6 16 11 16 14C16 18 13 20 9 20C5 20 2 18 2 14C2 11 5 6 9 2Z',
  }
  return (
    <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
      <path d={paths[shape]} fill={active ? '#ffe1fb' : '#f4f2fa'} stroke={color} strokeWidth="1.4" />
    </svg>
  )
}
