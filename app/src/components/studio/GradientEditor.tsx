import { useRef, useState } from 'react'
import { ArrowLeftRight, Plus, Trash2 } from 'lucide-react'
import type { CustomGradient, PaintMode, PaintStop } from '@/types/vibeu'

const DIRECTIONS: { label: string; start: [number, number]; end: [number, number] }[] = [
  { label: '↓ Dọc', start: [0.5, 0], end: [0.5, 1] },
  { label: '↘ Chéo', start: [0.15, 0.15], end: [0.85, 0.85] },
  { label: '→ Ngang', start: [0, 0.5], end: [1, 0.5] },
]

/** Default base/tip split for a fresh switch into French mode — a nude base band, a hard
 * (but not razor-sharp) transition, then the tip color for the rest of the free edge. `at`
 * on the two inner stops is the actual v-space (cuticle->tip) transition line, not a
 * gradient blend position — see nailFill.ts's `paint.mode === 'french'` branch. */
const FRENCH_DEFAULT_STOPS: PaintStop[] = [
  { at: 0, color: '#F3D9C6' },
  { at: 0.74, color: '#F3D9C6' },
  { at: 0.8, color: '#FFFFFF' },
  { at: 1, color: '#FFFFFF' },
]

const MODE_BUTTONS: { mode: PaintMode; label: string }[] = [
  { mode: 'solid', label: 'Đơn sắc' },
  { mode: 'ombre', label: 'Ombre' },
  { mode: 'linear', label: 'Gradient' },
  { mode: 'radial', label: 'Tròn' },
  { mode: 'aurora', label: 'Aura' },
  { mode: 'french', label: 'French' },
]

/** "Kiểu vân/hoạ tiết nền" — procedural texture patterns, kept as their own PaintMode
 * values (reusing the exact same multi-stop sampler as every other mode, just fed a
 * noise-based `t` instead of a directional one — see nailFill.ts) rather than a second
 * orthogonal system, since that's far less code for the same visual result. */
const PATTERN_BUTTONS: { mode: PaintMode; label: string }[] = [
  { mode: 'marble', label: 'Vân đá' },
  { mode: 'watercolor', label: 'Màu nước' },
  { mode: 'tortoiseshell', label: 'Đồi mồi' },
  { mode: 'bleed', label: 'Loang màu' },
]

function sortStops(stops: PaintStop[]): PaintStop[] {
  return [...stops].sort((a, b) => a.at - b.at)
}

function hexToRgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

/** Interpolated color at `at` from the existing stops — used so inserting a new stop is visually seamless until the user recolors it. */
function sampleGradientColor(stops: PaintStop[], at: number): string {
  const sorted = sortStops(stops)
  if (at <= sorted[0].at) return sorted[0].color
  for (let i = 1; i < sorted.length; i++) {
    if (at <= sorted[i].at) {
      const span = sorted[i].at - sorted[i - 1].at || 1
      const t = Math.min(1, Math.max(0, (at - sorted[i - 1].at) / span))
      const a = hexToRgb(sorted[i - 1].color)
      const b = hexToRgb(sorted[i].color)
      return rgbToHex([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t])
    }
  }
  return sorted[sorted.length - 1].color
}

function cssGradient(stops: PaintStop[]): string {
  const sorted = sortStops(stops)
  const parts = sorted.map((s) => `${s.color} ${(s.at * 100).toFixed(1)}%`)
  return `linear-gradient(to right, ${parts.join(', ')})`
}

/** Angle (0-360, 0 = pointing right, increasing clockwise in image space) -> a
 * start/end pair on the unit square's inscribed circle around its center, so the
 * gradient always spans the full nail regardless of rotation. */
function angleToStartEnd(angleDeg: number): { start: [number, number]; end: [number, number] } {
  const rad = (angleDeg * Math.PI) / 180
  const dx = Math.cos(rad) * 0.5
  const dy = Math.sin(rad) * 0.5
  return { start: [0.5 - dx, 0.5 - dy], end: [0.5 + dx, 0.5 + dy] }
}

function startEndToAngle(start: [number, number], end: [number, number]): number {
  const deg = (Math.atan2(end[1] - start[1], end[0] - start[0]) * 180) / Math.PI
  return deg < 0 ? deg + 360 : deg
}

export function GradientEditor({
  gradient,
  fallback,
  onChange,
}: {
  gradient: CustomGradient | null
  fallback: { mode: PaintMode; stops: PaintStop[]; start: [number, number]; end: [number, number] }
  onChange: (g: CustomGradient | null) => void
}) {
  const active = gradient ?? { ...fallback, stops: fallback.stops.map((s) => ({ ...s })) }
  const [selected, setSelected] = useState(0)
  const barRef = useRef<HTMLDivElement>(null)
  const dragIndex = useRef<number | null>(null)

  const commit = (patch: Partial<CustomGradient>) => onChange({ ...active, ...patch })

  const updateStopAt = (index: number, at: number) => {
    const stops = active.stops.map((s, i) => (i === index ? { ...s, at: Math.min(1, Math.max(0, at)) } : s))
    commit({ stops })
  }

  const updateStopColor = (index: number, color: string) => {
    const stops = active.stops.map((s, i) => (i === index ? { ...s, color } : s))
    commit({ stops })
  }

  const addStop = (at = 0.5) => {
    const stops = [...active.stops, { at, color: sampleGradientColor(active.stops, at) }]
    commit({ stops })
    setSelected(stops.length - 1)
  }

  const removeStop = (index: number) => {
    if (active.stops.length <= 2) return
    const stops = active.stops.filter((_, i) => i !== index)
    commit({ stops })
    setSelected(0)
  }

  /** Mirrors the gradient by flipping each stop's position (a stop at `at` moves to
   * `1 - at`); sorting afterwards naturally puts the colors in reversed order without
   * needing to touch which colors are assigned to which stop. */
  const reverseStops = () => {
    const stops = active.stops.map((s) => ({ ...s, at: 1 - s.at }))
    commit({ stops })
  }

  const barPointerToAt = (clientX: number) => {
    const bar = barRef.current
    if (!bar) return 0
    const rect = bar.getBoundingClientRect()
    return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
  }

  return (
    <div className="space-y-3 rounded-2xl border-2 border-vibe-ink/10 bg-white p-3.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-vibe-ink">Gradient tùy chỉnh</p>
        {gradient && (
          <button onClick={() => onChange(null)} className="text-[11px] font-semibold text-vibe-pink-dark hover:underline">
            Dùng lại preset
          </button>
        )}
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-vibe-ink-soft/70">Kiểu phủ</p>
        <div className="flex flex-wrap gap-1.5">
          {MODE_BUTTONS.map(({ mode: m, label }) => (
            <button
              key={m}
              onClick={() => {
                if (m === 'ombre') commit({ mode: m, start: [0.5, 0], end: [0.5, 1] })
                else if (m === 'french' && active.mode !== 'french') commit({ mode: m, stops: FRENCH_DEFAULT_STOPS.map((s) => ({ ...s })) })
                else commit({ mode: m })
              }}
              className={`rounded-full border-2 px-2.5 py-1 text-[11px] font-semibold ${
                active.mode === m ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 text-vibe-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-vibe-ink-soft/70">Kiểu vân / hoạ tiết nền</p>
        <div className="flex flex-wrap gap-1.5">
          {PATTERN_BUTTONS.map(({ mode: m, label }) => (
            <button
              key={m}
              onClick={() => commit({ mode: m })}
              className={`rounded-full border-2 px-2.5 py-1 text-[11px] font-semibold ${
                active.mode === m ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 text-vibe-ink-soft'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {active.mode === 'solid' ? (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={active.stops[0]?.color ?? '#ffffff'}
            onChange={(e) => commit({ stops: [{ at: 0, color: e.target.value }] })}
            className="h-9 w-12 cursor-pointer rounded-lg border border-vibe-ink/10"
          />
          <span className="text-[11px] text-vibe-ink-soft">Một màu duy nhất, phủ đều cả móng.</span>
        </div>
      ) : (
        <>
          <div
            ref={barRef}
            className="relative h-8 cursor-pointer rounded-full border-2 border-vibe-ink/10"
            style={{ background: cssGradient(active.stops) }}
            onPointerDown={(e) => {
              if (e.target !== e.currentTarget) return
              addStop(barPointerToAt(e.clientX))
            }}
          >
            {active.stops.map((s, i) => (
              <div
                key={i}
                onPointerDown={(e) => {
                  e.stopPropagation()
                  setSelected(i)
                  dragIndex.current = i
                  try {
                    ;(e.target as Element).setPointerCapture(e.pointerId)
                  } catch {
                    // Some input sources (synthetic events, certain touch/pen edge cases) don't
                    // have an active pointer to capture — the drag still works via bubbled
                    // pointermove/pointerup, this just loses capture-outside-the-element.
                  }
                }}
                onPointerMove={(e) => {
                  if (dragIndex.current !== i) return
                  updateStopAt(i, barPointerToAt(e.clientX))
                }}
                onPointerUp={() => {
                  dragIndex.current = null
                }}
                className={`absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow ${
                  selected === i ? 'border-vibe-pink-dark ring-2 ring-vibe-pink-dark/40' : 'border-white'
                }`}
                style={{ left: `${s.at * 100}%`, background: s.color }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="color"
              value={active.stops[selected]?.color ?? '#ffffff'}
              onChange={(e) => updateStopColor(selected, e.target.value)}
              className="h-8 w-10 cursor-pointer rounded-lg border border-vibe-ink/10"
            />
            <span className="text-[11px] text-vibe-ink-soft">
              Điểm {selected + 1}/{active.stops.length} · {Math.round((active.stops[selected]?.at ?? 0) * 100)}%
            </span>
            <div className="ml-auto flex gap-1.5">
              <button onClick={reverseStops} title="Đảo ngược gradient" className="grid h-7 w-7 place-items-center rounded-full border-2 border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-pink/40">
                <ArrowLeftRight size={14} />
              </button>
              <button onClick={() => addStop()} className="grid h-7 w-7 place-items-center rounded-full border-2 border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-pink/40">
                <Plus size={14} />
              </button>
              <button
                onClick={() => removeStop(selected)}
                disabled={active.stops.length <= 2}
                className="grid h-7 w-7 place-items-center rounded-full border-2 border-vibe-ink/10 text-vibe-ink-soft hover:border-vibe-pink/40 disabled:opacity-30"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </>
      )}

      {active.mode === 'linear' && (
        <>
          <div className="flex gap-1.5">
            {DIRECTIONS.map((d) => (
              <button
                key={d.label}
                onClick={() => commit({ start: d.start, end: d.end })}
                className="rounded-full border-2 border-vibe-ink/10 px-2.5 py-1 text-[11px] font-semibold text-vibe-ink-soft hover:border-vibe-pink/40"
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-vibe-ink-soft">Xoay góc</span>
            <input
              type="range"
              min={0}
              max={359}
              step={1}
              value={Math.round(startEndToAngle(active.start, active.end))}
              onChange={(e) => commit(angleToStartEnd(Number(e.target.value)))}
              className="h-2 flex-1 accent-vibe-pink-dark"
            />
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-vibe-ink-soft">
              {Math.round(startEndToAngle(active.start, active.end))}°
            </span>
          </div>
        </>
      )}
    </div>
  )
}
