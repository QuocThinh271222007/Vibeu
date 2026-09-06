import { useEffect, useState } from 'react'

function normalizeHex(raw: string): string | null {
  const cleaned = raw.trim().replace(/^#/, '')
  if (/^[0-9a-fA-F]{6}$/.test(cleaned)) return `#${cleaned.toUpperCase()}`
  if (/^[0-9a-fA-F]{3}$/.test(cleaned)) {
    return `#${cleaned
      .split('')
      .map((c) => c + c)
      .join('')
      .toUpperCase()}`
  }
  return null
}

/** Compact "#RRGGBB" text field paired with a swatch/wheel/native color input — lets a user
 * type or paste an exact color code instead of only dragging. Reverts to the last valid value
 * on blur/Enter if what's typed doesn't parse as a hex color. */
export function HexColorInput({ value, onChange, className }: { value: string; onChange: (hex: string) => void; className?: string }) {
  const [draft, setDraft] = useState(value.replace(/^#/, ''))

  useEffect(() => {
    setDraft(value.replace(/^#/, ''))
  }, [value])

  function commit() {
    const normalized = normalizeHex(draft)
    if (normalized) onChange(normalized)
    else setDraft(value.replace(/^#/, ''))
  }

  return (
    <label
      className={`flex items-center gap-1 rounded-lg border-2 border-vibe-ink/10 bg-white px-2 py-1.5 focus-within:border-vibe-pink/50 ${className ?? ''}`}
    >
      <span className="text-xs font-semibold text-vibe-ink-soft/70">#</span>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9a-fA-F]/g, '').slice(0, 6))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            commit()
            e.currentTarget.blur()
          }
        }}
        placeholder="RRGGBB"
        spellCheck={false}
        aria-label="Mã màu hex"
        className="w-[7.5ch] bg-transparent font-mono text-xs uppercase tracking-wide text-vibe-ink outline-none placeholder:text-vibe-ink-soft/40"
      />
    </label>
  )
}
