import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/home/WhyUs'
import { TemplatePreviewCard } from '@/components/studio/TemplatePreviewCard'
import { TEMPLATES } from '@/data/templates'
import { Button } from '@/components/ui/Button'

const FEATURED_IDS = ['gemini-sparkle', 'y2k-candy-pop', 'pisces-ocean-dream', 'leo-golden-glow']

export function SuggestedDesigns() {
  const navigate = useNavigate()
  const templates = TEMPLATES.filter((t) => FEATURED_IDS.includes(t.id))

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Mẫu đề xuất" title="Gợi ý riêng cho vibe hôm nay của bạn" />
        <Button variant="secondary" onClick={() => navigate('/library')}>
          Xem tất cả mẫu <ArrowRight size={18} />
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {templates.map((t, i) => (
          <TemplatePreviewCard key={t.id} template={t} index={i} />
        ))}
      </div>
    </section>
  )
}
