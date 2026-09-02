import { Link } from 'react-router-dom'

/**
 * Real brand assets (provided by the user), not the earlier CSS-drawn placeholder mark.
 * `full` renders the complete lockup (wordmark + "Nail xinh · Vibe mình" slogan baked into
 * the one image) for spacious contexts like the footer; the compact form (icon mark + a
 * styled text span, since the slogan is unreadable at header scale) is the default.
 */
export function Logo({ className = '', full = false }: { className?: string; full?: boolean }) {
  if (full) {
    return (
      <Link to="/" className={`inline-block ${className}`}>
        <img src="/assets/brand/logo-full.png" alt="VIBEU — Nail xinh, Vibe mình" className="h-auto w-full max-w-[220px]" />
      </Link>
    )
  }
  return (
    <Link to="/" className={`group flex items-center gap-2 ${className}`}>
      <img
        src="/assets/brand/logo-mark.png"
        alt="VIBEU"
        className="h-9 w-9 object-contain transition-transform group-hover:rotate-[-8deg] group-hover:scale-105"
      />
      <span className="font-display text-xl font-semibold tracking-tight text-vibe-ink">
        VIBE<span className="vibe-gradient-text">U</span>
      </span>
    </Link>
  )
}
