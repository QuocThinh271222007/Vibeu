import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronDown, RotateCcw, Sun } from 'lucide-react'
import { useStudioStore } from '@/store/studioStore'

/**
 * Dragging a range input can fire far more often than the screen can redraw (well past 60/s on
 * some trackpads/mice), and each commit to the store re-bakes all 5 nail rasters per-pixel
 * (composeNail in nailFill.ts) — the single biggest source of Studio jank customers reported.
 * This caps actual store commits to once per animation frame while the slider's own displayed
 * value still updates on every native input event, so dragging still feels instant.
 */
function useRafThrottled<T>(fn: (v: T) => void): (v: T) => void {
  const fnRef = useRef(fn)
  useEffect(() => {
    fnRef.current = fn
  })
  const rafRef = useRef<number | null>(null)
  const latestRef = useRef<T>(undefined as T)
  useEffect(() => () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
  }, [])
  return useCallback((v: T) => {
    latestRef.current = v
    if (rafRef.current !== null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      fnRef.current(latestRef.current)
    })
  }, [])
}

/**
 * Optional, collapsible user lighting control (DEFECT F's "Ánh sáng" section) — surfaced
 * only after the automatic photo-light normalization in nailFill.ts already makes the same
 * preset render consistently across hand photos. This panel is a preference layer on top
 * of that calibrated baseline, not a workaround users are forced into to fix a compositor
 * defect. Deliberately exposes only exposure/strength/direction — never raw renderer
 * internals (F0, roughness, photoAmbient, micro-normal strength, Fresnel, etc.).
 */
export function LightingPanel() {
  const [open, setOpen] = useState(false)
  const exposure = useStudioStore((s) => s.lightExposure)
  const strength = useStudioStore((s) => s.lightStrength)
  const angleDeg = useStudioStore((s) => s.lightAngleDeg)
  const setLightExposure = useStudioStore((s) => s.setLightExposure)
  const setLightStrength = useStudioStore((s) => s.setLightStrength)
  const setLightAngleDeg = useStudioStore((s) => s.setLightAngleDeg)
  const resetLighting = useStudioStore((s) => s.resetLighting)

  return (
    <div className="w-full max-w-[22rem] rounded-2xl border-2 border-vibe-ink/10 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-xs font-semibold text-vibe-ink"
      >
        <Sun size={14} className="text-vibe-yellow-dark" />
        Ánh sáng
        <ChevronDown size={14} className={`ml-auto text-vibe-ink-soft transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-vibe-ink/10 px-4 py-3.5">
          <LightSlider
            label="Độ sáng"
            value={exposure}
            min={-0.2}
            max={0.25}
            step={0.01}
            format={(v) => `${v >= 0 ? '+' : ''}${Math.round(v * 100)}%`}
            onChange={setLightExposure}
          />
          <LightSlider
            label="Cường độ"
            value={strength}
            min={0}
            max={1}
            step={0.02}
            format={(v) => `${Math.round(v * 100)}%`}
            onChange={setLightStrength}
          />
          <LightSlider
            label="Hướng sáng"
            value={angleDeg}
            min={-180}
            max={180}
            step={1}
            format={(v) => `${Math.round(v)}°`}
            onChange={setLightAngleDeg}
          />

          <button
            onClick={resetLighting}
            className="flex items-center gap-1.5 text-[11px] font-semibold text-vibe-pink-dark hover:underline"
          >
            <RotateCcw size={12} /> Tự động (khôi phục mặc định)
          </button>
        </div>
      )}
    </div>
  )
}

function LightSlider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
}) {
  // Own local value so the thumb position and % label track every native input event
  // instantly — the actual store commit (and the expensive nail re-bake it triggers) is
  // throttled to once per frame via useRafThrottled below, and re-synced whenever `value`
  // changes from outside this slider (e.g. the "Tự động" reset button).
  const [live, setLive] = useState(value)
  const [syncedValue, setSyncedValue] = useState(value)
  if (value !== syncedValue) {
    setSyncedValue(value)
    setLive(value)
  }
  const commit = useRafThrottled(onChange)

  return (
    <label className="block">
      <div className="mb-1 flex items-center justify-between text-[11px] text-vibe-ink-soft">
        <span>{label}</span>
        <span className="font-semibold text-vibe-ink">{format(live)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={live}
        onChange={(e) => {
          const v = parseFloat(e.target.value)
          setLive(v)
          commit(v)
        }}
        className="w-full accent-vibe-pink-dark"
      />
    </label>
  )
}
