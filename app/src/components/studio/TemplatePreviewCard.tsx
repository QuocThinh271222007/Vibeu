import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Wand2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { HandCanvas } from '@/components/studio/HandCanvas'
import type { Template } from '@/types/vibeu'
import { fingersFromTemplate } from '@/lib/templateUtils'

export function TemplatePreviewCard({ template, index = 0 }: { template: Template; index?: number }) {
  const [saved, setSaved] = useState(false)
  const navigate = useNavigate()
  const fingers = fingersFromTemplate(template)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[1.75rem] bg-white shadow-[0_10px_30px_-16px_rgba(80,50,120,0.25)] transition-shadow hover:shadow-vibe-lg"
    >
      <div className="relative">
        <HandCanvas skinTone={template.skinTone} fingers={fingers} className="rounded-none" />
        <button
          onClick={() => setSaved((s) => !s)}
          aria-label="Lưu mẫu"
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white/85 backdrop-blur transition-transform hover:scale-110 active:scale-95"
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
    </motion.div>
  )
}
