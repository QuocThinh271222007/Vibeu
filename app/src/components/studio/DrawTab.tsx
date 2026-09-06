import { Droplet, Eraser, PenLine, Undo2 } from 'lucide-react'
import { ColorWheel } from './ColorWheel'

const BRUSH_SIZES: { width: number; label: string }[] = [
  { width: 2, label: 'Mảnh' },
  { width: 4, label: 'Vừa' },
  { width: 8, label: 'Đậm' },
  { width: 12, label: 'Siêu đậm' },
]

const BRUSH_BLENDS: { id: 'normal' | 'multiply'; label: string; hint: string }[] = [
  { id: 'multiply', label: 'Hoà màu', hint: 'Nét vẽ hoà vào lớp sơn bên dưới, giống mực thấm vào móng.' },
  { id: 'normal', label: 'Nổi khối', hint: 'Nét vẽ phủ đè lên trên, rõ khối như vẽ nổi/đắp đá.' },
]

export function DrawTab({
  brushWidth,
  brushColor,
  brushOpacity,
  brushBlend,
  hasStrokes,
  onBrushWidth,
  onBrushColor,
  onBrushOpacity,
  onBrushBlend,
  onUndoLast,
  onClear,
}: {
  brushWidth: number
  brushColor: string
  brushOpacity: number
  brushBlend: 'normal' | 'multiply'
  hasStrokes: boolean
  onBrushWidth: (w: number) => void
  onBrushColor: (c: string) => void
  onBrushOpacity: (o: number) => void
  onBrushBlend: (b: 'normal' | 'multiply') => void
  onUndoLast: () => void
  onClear: () => void
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl bg-vibe-pink/10 px-3.5 py-2.5 text-xs font-medium text-vibe-pink-dark">
        <PenLine size={15} className="shrink-0" />
        Vẽ trực tiếp lên móng đang chọn — chạm và kéo trên móng để vẽ nét tự do. Dùng chuột thì nên phóng to (nút Zoom phía trên) để vẽ chính xác hơn.
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
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-vibe-ink">
          <Droplet size={14} /> Độ mờ nét vẽ
        </p>
        <div className="flex items-center gap-3 rounded-2xl border-2 border-vibe-ink/10 bg-white px-3.5 py-3">
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={brushOpacity}
            onChange={(e) => onBrushOpacity(Number(e.target.value))}
            className="h-2 flex-1 accent-vibe-pink-dark"
          />
          <span className="w-10 shrink-0 text-right text-xs font-semibold text-vibe-ink-soft">{Math.round(brushOpacity * 100)}%</span>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-vibe-ink">Kiểu nét</p>
        <div className="grid grid-cols-2 gap-2.5">
          {BRUSH_BLENDS.map((b) => (
            <button
              key={b.id}
              onClick={() => onBrushBlend(b.id)}
              title={b.hint}
              className={`rounded-2xl border-2 px-3 py-2.5 text-left text-xs font-semibold transition-colors ${
                brushBlend === b.id ? 'border-vibe-pink-dark bg-vibe-pink/10 text-vibe-ink' : 'border-vibe-ink/10 bg-white text-vibe-ink-soft hover:border-vibe-pink/30'
              }`}
            >
              {b.label}
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

      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onUndoLast}
          disabled={!hasStrokes}
          className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-vibe-ink/10 py-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-vibe-blue/40 hover:text-vibe-ink disabled:opacity-30"
        >
          <Undo2 size={14} /> Hoàn tác nét vừa vẽ
        </button>
        <button
          onClick={onClear}
          disabled={!hasStrokes}
          className="flex items-center justify-center gap-1.5 rounded-2xl border-2 border-vibe-ink/10 py-2.5 text-xs font-semibold text-vibe-ink-soft hover:border-red-300 hover:text-red-500 disabled:opacity-30"
        >
          <Eraser size={14} /> Xoá tất cả
        </button>
      </div>
    </div>
  )
}
