import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { Chip } from '@/components/ui/Chip'
import { ScrollableRow } from '@/components/ui/ScrollableRow'
import { TemplatePreviewCard } from '@/components/studio/TemplatePreviewCard'
import { curatedPreviewRank } from '@/data/curatedPreviews'
import { useTemplates } from '@/data/loaders'
import { TEMPLATE_TAGS } from '@/data/templateTags'
import { PageMeta } from '@/components/seo/PageMeta'

const FILTERS = [{ id: 'all', label: 'Tất cả' }, ...TEMPLATE_TAGS]

export default function Library() {
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const { templates: allTemplates, loading } = useTemplates()

  const templates = useMemo(() => {
    let list = allTemplates
    if (filter !== 'all') list = list.filter((t) => t.tags.includes(filter))
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter((t) => t.name.toLowerCase().includes(q) || t.hashtag.toLowerCase().includes(q))
    }
    return [...list].sort((a, b) => curatedPreviewRank(a) - curatedPreviewRank(b))
  }, [allTemplates, filter, query])

  return (
    <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
      <PageMeta
        title="Thư viện mẫu nail"
        description="Hàng trăm mẫu nail được tuyển chọn theo cung hoàng đạo, mùa, xu hướng — dùng ngay trong Studio hoặc lưu lại để dành cho dịp khác."
        canonicalPath="/thu-vien"
      />
      <div className="text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-vibe-cream px-3.5 py-1 text-xs font-semibold uppercase tracking-wide text-vibe-pink-dark">
          Thư viện mẫu
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-vibe-ink sm:text-4xl">{loading ? '…' : `${allTemplates.length}+`} mẫu nail chất lượng cao</h1>
        <p className="mx-auto mt-3 max-w-xl text-vibe-ink-soft">Tìm cảm hứng và dùng ngay trong Studio — hoặc lưu vào tủ đồ để dành cho dịp khác.</p>
      </div>

      <div className="mx-auto mt-8 max-w-lg">
        <label className="flex items-center gap-2 rounded-full border-2 border-vibe-ink/10 bg-white px-4 py-2.5 shadow-sm">
          <Search size={17} className="text-vibe-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm theo tên mẫu, hashtag…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-vibe-ink-soft/60"
          />
        </label>
      </div>

      <ScrollableRow className="mt-6 flex gap-2 pb-2 sm:flex-wrap sm:justify-center sm:overflow-visible">
        {FILTERS.map((f) => (
          <Chip key={f.id} active={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </Chip>
        ))}
      </ScrollableRow>

      {loading ? (
        // Reserves the grid's footprint instead of flashing "Không tìm thấy mẫu phù hợp" (wrong
        // message for "still loading") then jumping to full height once real cards arrive — that
        // 0-to-full jump was a real, measured CLS contributor on this page.
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
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
      ) : templates.length === 0 ? (
        <p className="py-20 text-center text-vibe-ink-soft">Không tìm thấy mẫu phù hợp, thử bộ lọc khác nhé.</p>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {templates.map((t, i) => (
            <TemplatePreviewCard key={t.id} template={t} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
