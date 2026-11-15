import { Link } from 'react-router-dom'

// Nginx serves everything under /assets/ with a 1-year immutable Cache-Control (correct for
// Vite's content-hashed JS/CSS chunks), but these two logo files keep the same plain filename
// across edits — resizing them down (2026-09-30 perf pass) left real visitors and Cloudflare's
// edge cache stuck serving the old 500x500/757x330 originals for up to a year, since nothing
// about the URL changed to tell either cache the content did. Bumping this whenever the source
// files change is what actually invalidates both caches — same pattern already used for the
// hand base photos (see HAND_ASSET_REVISION in data/loaders.ts).
const LOGO_ASSET_REVISION = '20260930-resize'

/**
 * Real brand assets (provided by the user), not the earlier CSS-drawn placeholder mark.
 * `full` renders the complete lockup (wordmark + "Nail xinh · Vibe mình" slogan baked into
 * the one image) for spacious contexts like the footer. The compact form (default) is the
 * icon mark alone, per user request — no wordmark text, no slogan text next to it.
 */
export function Logo({ className = '', full = false }: { className?: string; full?: boolean }) {
  if (full) {
    return (
      <Link to="/" className={`inline-block ${className}`}>
        <img
          src={`/assets/brand/logo-full.png?v=${LOGO_ASSET_REVISION}`}
          alt="VIBEU — Nail xinh, Vibe mình"
          width={460}
          height={201}
          className="h-auto w-full max-w-[220px]"
        />
      </Link>
    )
  }
  return (
    <Link to="/" className={`group inline-flex items-center ${className}`}>
      <img
        src={`/assets/brand/logo-mark.png?v=${LOGO_ASSET_REVISION}`}
        alt="VIBEU"
        width={160}
        height={160}
        className="h-9 w-9 object-contain transition-transform group-hover:rotate-[-8deg] group-hover:scale-105"
      />
    </Link>
  )
}
