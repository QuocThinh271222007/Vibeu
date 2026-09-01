import { ImageIcon } from 'lucide-react'

/**
 * Explicit, honest "no real media yet" surface — used wherever a data model supports a
 * real photo/illustration but one hasn't been supplied. Deliberately NOT an emoji, NOT a
 * generic flat brand-colored box pretending to be content: a neutral icon + label so it
 * reads as "asset pending," never as a design choice or a broken image.
 */
export function MediaPlaceholder({
  label = 'Ảnh minh hoạ đang được cập nhật',
  compact = false,
  className = '',
}: {
  label?: string
  /** Icon-only, no label — for small thumbnails where the text can't fit. */
  compact?: boolean
  className?: string
}) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 bg-vibe-cream text-vibe-ink-soft/70 ${className}`}>
      <ImageIcon size={compact ? 18 : 28} strokeWidth={1.5} />
      {!compact && <p className="max-w-[80%] text-center text-xs font-medium">{label}</p>}
    </div>
  )
}
