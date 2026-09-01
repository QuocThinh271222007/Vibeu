import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ExternalLink, RefreshCcw } from 'lucide-react'
import { Logo } from '@/components/ui/Logo'
import type { SkinToneId } from '@/types/vibeu'

const SKIN_TONES: { id: SkinToneId; label: string; swatch: string }[] = [
  { id: 'cozy', label: 'Ấm', swatch: '#E3B79A' },
  { id: 'matcha', label: 'Sáng', swatch: '#F0CBA8' },
]

export function StudioTopBar({
  skinTone,
  onSkinTone,
  onReset,
}: {
  skinTone: SkinToneId
  onSkinTone: (t: SkinToneId) => void
  onReset: () => void
}) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between gap-3 border-b border-vibe-ink/10 bg-white/80 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-2 text-sm font-semibold text-vibe-ink transition-colors hover:bg-vibe-pink hover:text-white"
        >
          <ArrowLeft size={16} /> <span className="hidden sm:inline">Quay lại</span>
        </button>
        <div className="hidden sm:block">
          <Logo />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-full bg-vibe-cream p-1">
        {SKIN_TONES.map((t) => (
          <button
            key={t.id}
            onClick={() => onSkinTone(t.id)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
              skinTone === t.id ? 'bg-white shadow-sm text-vibe-ink' : 'text-vibe-ink-soft'
            }`}
          >
            <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: t.swatch }} />
            Da {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://shopee.vn"
          target="_blank"
          rel="noreferrer"
          className="hidden items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft transition-colors hover:border-vibe-blue/50 hover:text-vibe-ink sm:flex"
        >
          Shopee <ExternalLink size={14} />
        </a>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 rounded-full border-2 border-vibe-ink/10 px-3.5 py-2 text-sm font-medium text-vibe-ink-soft transition-colors hover:border-vibe-pink/50 hover:text-vibe-ink"
        >
          <RefreshCcw size={15} /> <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  )
}
