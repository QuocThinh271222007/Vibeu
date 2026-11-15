import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { SectionHeading } from '@/components/home/WhyUs'
import { TemplatePreviewCard } from '@/components/studio/TemplatePreviewCard'
import { useTemplatePicks } from '@/lib/homepageShowcase'
import { Button } from '@/components/ui/Button'

// Verified to exist and be visible as of 2026-09-30 — the original 4 ids here had all quietly
// become deleted templates (this section was rendering nothing at all), and useTemplatePicks'
// full-table fallback for backfilling a miss is too slow to finish inside prerender.mjs's fixed
// settle delay, which left the *prerendered* (crawler-facing) snapshot empty even once the fix
// made real visitors' browsers fill it in a moment later. Picking ids that resolve on the first,
// fast by-id fetch sidesteps that race entirely. Also genuinely light: this library's hand-drawn
// templates range from under 1KB to 1MB+ of `fingers` JSON (free-hand pen strokes) — the previous
// picks here (galactic-moo-d, chocoberry) were 250-270KB each and, combined with Hero's showcase,
// measurably dragged down the homepage's Lighthouse score (2026-09-30 perf pass). pisces-ocean-
// dream also has a real curated cover photo (no live canvas render needed at all).
const FEATURED_IDS = ['red-velvet-plaid-2', 'seonghyeon-1225', 'pisces-ocean-dream', 'dua-hau']
const SLOT_COUNT = FEATURED_IDS.length

export function SuggestedDesigns() {
  const navigate = useNavigate()
  // Fetched by id (not useTemplates()'s full-table list) — this section only ever shows a fixed
  // handful of picks, and pulling in every template just to filter down to a few was real,
  // measured, wasted egress. useTemplatePicks backfills from the rest of the library if any of
  // these ever gets deleted too, so this can't silently go back to rendering nothing.
  const templates = useTemplatePicks(FEATURED_IDS, SLOT_COUNT)

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeading eyebrow="Mẫu đề xuất" title="Gợi ý riêng cho vibe hôm nay của bạn" />
        <Button variant="secondary" onClick={() => navigate('/thu-vien')}>
          Xem tất cả mẫu <ArrowRight size={18} />
        </Button>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {templates.length > 0
          ? templates.map((t, i) => <TemplatePreviewCard key={t.id} template={t} index={i} eager={false} />)
          : // Reserves the same footprint the real cards will take (aspect-[2/3] image + ~90px of
            // text/button below, matching TemplatePreviewCard's own layout) so this grid never
            // goes from 0px tall to its final height once the async fetch resolves — that jump
            // was a real, measured contributor to this site's poor CLS score (everything below
            // this section — the CTA banner, footer — would suddenly get shoved down).
            Array.from({ length: SLOT_COUNT }, (_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-[1.75rem] bg-vibe-highlight">
                <div className="aspect-[2/3] bg-vibe-cream" />
                <div className="p-4">
                  <div className="h-4 w-3/4 rounded bg-vibe-cream" />
                  <div className="mt-2 h-3 w-1/2 rounded bg-vibe-cream" />
                  <div className="mt-3 h-8 w-full rounded-full bg-vibe-cream" />
                </div>
              </div>
            ))}
      </div>
    </section>
  )
}
