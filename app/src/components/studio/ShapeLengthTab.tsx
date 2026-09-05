import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FingerDesign, FingerId, NailLength, NailShape, SkinToneId } from '@/types/vibeu'
import { SHAPE_LABEL_VI } from '@/types/vibeu'
import { availableLengthsForShape } from '@/data/handVariants'
import { uniformShapeLength } from '@/lib/geometry'

const SHAPES: NailShape[] = ['oval', 'square', 'coffin', 'almond']
const LENGTHS: NailLength[] = ['S', 'M', 'L']

export function ShapeLengthTab({
  design,
  skinTone,
  fingers,
  onShape,
  onLength,
}: {
  design: FingerDesign
  skinTone: SkinToneId
  fingers: Record<FingerId, FingerDesign>
  onShape: (s: NailShape, applyToAll: boolean) => void
  onLength: (l: NailLength, applyToAll: boolean) => void
}) {
  // Defaults to true: a whole-hand real-photo switch is what almost every user wants when
  // touching shape/length (real manicures are uniform across the hand); per-finger mixing
  // is the opt-out, not the default. Leaving this false by default made "change shape" look
  // like a no-op for anyone who didn't notice the checkbox — see CLAUDE-REVIEW-BATCH1.md §8.
  const [applyToAll, setApplyToAll] = useState(true)
  const availableLengths = availableLengthsForShape(skinTone, design.shape)
  const currentHasPhoto = availableLengths.includes(design.length)
  const isUniform = Boolean(uniformShapeLength(fingers))

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between">
        <p className="text-xs text-vibe-ink-soft">Chọn ngón đang chỉnh ở khung bên, hoặc áp dụng cho cả bộ:</p>
        <label className="flex shrink-0 items-center gap-1.5 text-xs text-vibe-ink-soft">
          <input type="checkbox" checked={applyToAll} onChange={(e) => setApplyToAll(e.target.checked)} className="accent-vibe-pink-dark" />
          Áp dụng cả 5 ngón
        </label>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Form móng</p>
        <div className="grid grid-cols-4 gap-2.5">
          {SHAPES.map((s) => (
            <button
              key={s}
              onClick={() => onShape(s, applyToAll)}
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
            <button key={l} onClick={() => onLength(l, applyToAll)} className="relative z-10 flex-1 py-2.5 text-sm font-semibold">
              {design.length === l && (
                <motion.span
                  layoutId="length-pill"
                  className="absolute inset-0 -z-10 rounded-full bg-white shadow-sm"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className={design.length === l ? 'text-vibe-ink' : 'text-vibe-ink-soft'}>{l}</span>
              <span
                className={`absolute right-2 top-1.5 h-1.5 w-1.5 rounded-full ${
                  availableLengths.includes(l) ? 'bg-emerald-400' : 'bg-vibe-ink/15'
                }`}
                title={availableLengths.includes(l) ? 'Đã có ảnh tay thật' : 'Chưa có ảnh tay thật cho độ dài này'}
              />
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-vibe-ink-soft">S = ngắn gọn · M = vừa vặn · L = dài nổi bật</p>
        <p className="mt-1 text-xs text-vibe-ink-soft">
          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 align-middle" /> = đã có ảnh tay thật cho form + độ dài đó.
          Khi cả 5 ngón cùng một form &amp; độ dài có chấm xanh, Studio sẽ đổi sang ảnh tay thật khớp với lựa chọn đó.
        </p>
        {!currentHasPhoto && (
          <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">
            Form <strong>{SHAPE_LABEL_VI[design.shape]}</strong>, độ dài <strong>{design.length}</strong> chưa có ảnh tay thật.
            Studio vẫn lưu đúng lựa chọn này vào công thức, nhưng ảnh xem trước sẽ tạm hiển thị ảnh tay mặc định (Oval, M) để
            tránh làm méo/lệch hình móng thật.
          </p>
        )}
        {currentHasPhoto && !isUniform && (
          <p className="mt-2 rounded-xl bg-amber-50 p-2.5 text-xs text-amber-800">
            Các ngón hiện chưa cùng form &amp; độ dài <strong>{SHAPE_LABEL_VI[design.shape]}, {design.length}</strong>, nên ảnh
            xem trước vẫn giữ ảnh mặc định. Tick <strong>"Áp dụng cả 5 ngón"</strong> ở trên rồi chọn lại để cả bàn tay đổi
            sang đúng ảnh thật.
          </p>
        )}
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
