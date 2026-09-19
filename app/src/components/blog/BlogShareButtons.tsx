import { useState } from 'react'
import { Check, Link2 } from 'lucide-react'
import { FacebookGlyph } from '@/components/ui/SocialGlyphs'

/** X's own logo was dropped from lucide-react (brand icons policy) — same minimal-glyph approach
 * as SocialGlyphs.tsx uses for Facebook/Instagram/Threads elsewhere in the app. */
function XGlyph({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

/**
 * Facebook/X share-intent links + copy-link — deliberately not the Web Share API: it's
 * inconsistent across desktop browsers (no Firefox/desktop-Safari support), and a blog post
 * benefits more from always-visible, explicit share targets than a native sheet that may or may
 * not appear. Plain window.open()/clipboard calls only — nothing deprecated, nothing that needs
 * a permission prompt.
 */
export function BlogShareButtons({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API can be denied/unavailable — the link is still visible in the address bar,
      // so there's nothing more useful to do than silently no-op.
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-vibe-ink-soft">Chia sẻ:</span>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        title="Chia sẻ lên Facebook"
        className="grid h-8 w-8 place-items-center rounded-full bg-white text-vibe-ink-soft shadow-sm transition-colors hover:text-vibe-blue-dark"
      >
        <FacebookGlyph size={15} />
      </a>
      <a
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        title="Chia sẻ lên X"
        className="grid h-8 w-8 place-items-center rounded-full bg-white text-vibe-ink-soft shadow-sm transition-colors hover:text-vibe-ink"
      >
        <XGlyph size={14} />
      </a>
      <button
        type="button"
        onClick={copyLink}
        title="Sao chép liên kết"
        className="grid h-8 w-8 place-items-center rounded-full bg-white text-vibe-ink-soft shadow-sm transition-colors hover:text-vibe-pink-dark"
      >
        {copied ? <Check size={15} className="text-emerald-600" /> : <Link2 size={15} />}
      </button>
    </div>
  )
}
