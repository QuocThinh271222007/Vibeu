import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/home/WhyUs'
import { TemplatePreviewCard } from '@/components/studio/TemplatePreviewCard'
import { useTemplates } from '@/data/loaders'
import { Button } from '@/components/ui/Button'

const FEATURED_IDS = ['strawberry-lace-dream', 'gemini-sparkle', 'xuan-cherry-blossom', 'minimalist-nude']

export function SuggestedDesigns() {
  const navigate = useNavigate()
  const { templates: allTemplates } = useTemplates()
  const templates = FEATURED_IDS.map((id) => allTemplates.find((t) => t.id === id)).filter((t): t is NonNullable<typeof t> => Boolean(t))

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
