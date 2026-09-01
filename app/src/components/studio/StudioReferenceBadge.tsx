import { findTemplate } from '@/data/templates'
import { resolveTemplatePreview } from '@/data/curatedPreviews'

/**
 * A small, non-intrusive cue shown only when the loaded template has a curated
 * reference photo: "this is the visual target; the canvas above is your editable
 * approximation." It never replaces the live HandCanvas — Studio must stay editable.
 */
export function StudioReferenceBadge({ templateId }: { templateId: string | null }) {
  if (!templateId) return null
  const template = findTemplate(templateId)
  if (!template) return null
  const preview = resolveTemplatePreview(template)
  if (preview?.type !== 'curated' || !preview.image) return null

  return (
    <div className="flex items-center gap-2 rounded-full bg-white/80 py-1 pl-1 pr-3 shadow-sm">
      <img
        src={preview.image}
        alt={preview.alt ?? template.name}
        className="h-8 w-8 rounded-full object-cover"
        style={{ objectPosition: preview.objectPosition ?? 'center center' }}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
      <span className="text-[11px] font-medium text-vibe-ink-soft">Ảnh tham khảo — canvas bên trên là bản chỉnh sửa được</span>
    </div>
  )
}
