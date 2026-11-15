import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { TemplatePreviewMedia } from '@/components/studio/TemplatePreviewMedia'
import type { Template } from '@/types/vibeu'

export function TemplatePreviewCard({
  template,
  index = 0,
  eager,
}: {
  template: Template
  index?: number
  /** Defaults to the first 4 cards (Library.tsx's grid, where those are genuinely above the
   * fold) — SuggestedDesigns.tsx overrides this to false since its whole section sits well
   * below the homepage's fold, so eager-loading its images was pure bandwidth contention
   * against the Hero images that actually gate LCP (2026-09-30 perf pass). */
  eager?: boolean
}) {
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 7) * 0.035, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[1.75rem] bg-vibe-highlight shadow-[0_10px_30px_-16px_rgba(80,50,120,0.25)] transition-shadow hover:shadow-vibe-lg"
    >
      <div className="relative aspect-[2/3] overflow-hidden">
        <TemplatePreviewMedia
          template={template}
          className="h-full w-full"
          imageClassName="transition-transform duration-500 ease-out group-hover:scale-[1.025]"
          eager={eager ?? index < 4}
          staggerIndex={index}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <button
          onClick={() => setSaved((s) => !s)}
          aria-label="Lưu mẫu"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/88 shadow-sm backdrop-blur transition-transform hover:scale-110 active:scale-95"
        >
          <Heart size={17} className={saved ? 'fill-vibe-pink-dark text-vibe-pink-dark' : 'text-vibe-ink-soft'} />
        </button>
      </div>

      <div className="p-4">
        <p className="font-display text-sm font-semibold text-vibe-ink">{template.name}</p>
        <p className="mt-0.5 truncate text-xs text-vibe-ink-soft">{template.hashtag}</p>
        <button
          onClick={() => navigate(`/studio?template=${template.id}`)}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-full bg-vibe-cream py-2 text-xs font-semibold text-vibe-ink transition-colors group-hover:bg-vibe-pink group-hover:text-white"
        >
          <Wand2 size={14} /> Dùng mẫu này
        </button>
      </div>
    </motion.article>
  )
}
