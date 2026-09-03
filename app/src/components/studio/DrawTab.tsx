import { Eraser, PenLine } from 'lucide-react'
import { ColorWheel } from './ColorWheel'

const BRUSH_SIZES: { width: number; label: string }[] = [
  { width: 2, label: 'Mảnh' },
  { width: 4, label: 'Vừa' },
  { width: 8, label: 'Đậm' },
  { width: 12, label: 'Siêu đậm' },
]

export function DrawTab({
  brushWidth,
  brushColor,
  hasStrokes,
  onBrushWidth,
  onBrushColor,
  onClear,
}: {
  brushWidth: number
  brushColor: string
  hasStrokes: boolean
  onBrushWidth: (w: number) => void
  onBrushColor: (c: string) => void
  onClear: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl bg-vibe-pink/10 px-3.5 py-2.5 text-xs font-medium text-vibe-pink-dark">
        <PenLine size={15} className="shrink-0" />
        Vẽ trực tiếp lên móng đang chọn — chạm và kéo trên móng để vẽ nét tự do.
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Cọ vẽ</p>
        <div className="grid grid-cols-4 gap-2.5">
          {BRUSH_SIZES.map((b) => (
            <button
              key={b.width}
              onClick={() => onBrushWidth(b.width)}
              className={`flex flex-col items-center gap-2 rounded-2xl border-2 py-3 transition-colors ${
                brushWidth === b.width ? 'border-vibe-pink-dark bg-vibe-pink/10' : 'border-vibe-ink/10 bg-white hover:border-vibe-pink/30'
              }`}
            >
              <span className="grid h-8 w-8 place-items-center">
                <span
                  className="rounded-full bg-vibe-ink"
                  style={{ width: Math.max(2, b.width), height: Math.max(2, b.width) }}
                />
              </span>
              <span className="text-[11px] font-medium text-vibe-ink">{b.label}</span>
              <span className="text-[10px] text-vibe-ink-soft">{b.width}px</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Màu nét vẽ</p>
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-vibe-ink/10 bg-white py-4">
          <ColorWheel value={brushColor} onChange={onBrushColor} />
          <span className="text-xs text-vibe-ink-soft">
            Màu hiện tại: <span className="font-semibold text-vibe-ink">{brushColor}</span>
          </span>
        </div>
      </div>

      <button
        onClick={onClear}
        disabled={!hasStrokes}
        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-vibe-ink/10 py-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-red-300 hover:text-red-500 disabled:opacity-30"
      >
        <Eraser size={14} /> Xoá tất cả nét vẽ trên móng này
      </button>
    </div>
  )
}
