import { useCallback, useEffect, useRef, useState } from 'react'

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)]
}

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6
    else if (max === g) h = (b - r) / d + 2
    else h = (r - g) / d + 4
    h *= 60
    if (h < 0) h += 360
  }
  const s = max === 0 ? 0 : d / max
  return [h, s, max]
}

function hexToRgb(hex: string): [number, number, number] {
  const n = hex.replace('#', '')
  return [parseInt(n.slice(0, 2), 16) || 0, parseInt(n.slice(2, 4), 16) || 0, parseInt(n.slice(4, 6), 16) || 0]
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, '0')
  return `#${c(r)}${c(g)}${c(b)}`
}

const SIZE = 168

/** Circular hue/saturation wheel (angle = hue, radius = saturation) plus a brightness
 * slider, replacing the native rectangular `<input type="color">` swatch. */
export function ColorWheel({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const [hsv, setHsv] = useState<[number, number, number]>(() => rgbToHsv(...hexToRgb(value)))

  // Re-sync from outside changes (a preset pick, "Xoá", etc.) — but not from this wheel's
  // own onChange calls, which already keep local hsv authoritative for the drag gesture.
  useEffect(() => {
    setHsv(rgbToHsv(...hexToRgb(value)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const r = SIZE / 2
    const img = ctx.createImageData(SIZE, SIZE)
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x - r
        const dy = y - r
        const dist = Math.hypot(dx, dy)
        const idx = (y * SIZE + x) * 4
        if (dist > r) {
          img.data[idx + 3] = 0
          continue
        }
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI
        if (angle < 0) angle += 360
        const sat = Math.min(1, dist / r)
        const [rr, gg, bb] = hsvToRgb(angle, sat, 1)
        img.data[idx] = rr
        img.data[idx + 1] = gg
        img.data[idx + 2] = bb
        img.data[idx + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
  }, [])

  const updateFromPoint = useCallback(
    (clientX: number, clientY: number) => {
      const el = wheelRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const dx = clientX - cx
      const dy = clientY - cy
      const r = rect.width / 2
      const dist = Math.min(1, Math.hypot(dx, dy) / r)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI
      if (angle < 0) angle += 360
      setHsv(([, , v]) => {
        const [rr, gg, bb] = hsvToRgb(angle, dist, v)
        onChange(rgbToHex(rr, gg, bb))
        return [angle, dist, v]
      })
    },
    [onChange],
  )

  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true
    try {
      ;(e.target as Element).setPointerCapture(e.pointerId)
    } catch {
      // Some input sources (synthetic events, certain touch/pen edge cases) don't have an
      // active pointer to capture — the drag still works via bubbled pointermove/pointerup.
    }
    updateFromPoint(e.clientX, e.clientY)
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    updateFromPoint(e.clientX, e.clientY)
  }
  const endDrag = () => {
    dragging.current = false
  }

  const onValueChange = (v: number) => {
    setHsv(([h, s]) => {
      const [rr, gg, bb] = hsvToRgb(h, s, v)
      onChange(rgbToHex(rr, gg, bb))
      return [h, s, v]
    })
  }

  const [h, s, v] = hsv
  const r = SIZE / 2
  const rad = (h * Math.PI) / 180
  const dotX = r + Math.cos(rad) * s * r
  const dotY = r + Math.sin(rad) * s * r

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        className="relative touch-none select-none"
        style={{ width: SIZE, height: SIZE }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <div className="absolute inset-0 overflow-hidden rounded-full shadow-inner" style={{ filter: `brightness(${v})` }}>
          <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-full w-full" />
        </div>
        <div
          className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
          style={{ left: dotX, top: dotY, background: value }}
        />
      </div>
      <div className="flex w-full max-w-[168px] items-center gap-2">
        <span className="shrink-0 text-[11px] font-semibold text-vibe-ink-soft">Độ sáng</span>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={v}
          onChange={(e) => onValueChange(Number(e.target.value))}
          className="h-2 flex-1 accent-vibe-pink-dark"
        />
      </div>
    </div>
  )
}
