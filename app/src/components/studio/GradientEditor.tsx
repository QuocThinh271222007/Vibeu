import { useRef, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { CustomGradient, PaintMode, PaintStop } from '@/types/vibeu'

const DIRECTIONS: { label: string; start: [number, number]; end: [number, number] }[] = [
  { label: '↓ Dọc', start: [0.5, 0], end: [0.5, 1] },
  { label: '↘ Chéo', start: [0.15, 0.15], end: [0.85, 0.85] },
  { label: '→ Ngang', start: [0, 0.5], end: [1, 0.5] },
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

      <div className="flex gap-1.5">
        {(['linear', 'radial'] as PaintMode[]).map((m) => (
          <button
            key={m}
            onClick={() => commit({ mode: m })}
            className={`rounded-full border-2 px-2.5 py-1 text-[11px] font-semibold ${
              active.mode === m ? 'border-vibe-blue-dark bg-vibe-blue/15 text-vibe-ink' : 'border-vibe-ink/10 text-vibe-ink-soft'
            }`}
          >
            {m === 'linear' ? 'Thẳng' : 'Tròn'}
          </button>
        ))}
      </div>

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

      {active.mode === 'linear' && (
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
      )}
    </div>
  )
}
