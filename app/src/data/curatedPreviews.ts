import type { Template, TemplatePreview } from '@/types/vibeu'

/**
 * Editorial photography used only on marketing/library surfaces.
 * These images are deliberately separate from the editable Studio compositor:
 * a static card should look like a real manicure photo, while Studio remains
 * an honest live approximation users can edit finger by finger.
 *
 * Source pages and licenses are documented in
 * public/assets/templates/CURATED-SOURCES.md.
 */
const CURATED_PREVIEWS: Record<string, TemplatePreview> = {
  'gemini-sparkle': {
    type: 'curated',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Acrylic_nail_art_with_crystal.jpg/960px-Acrylic_nail_art_with_crystal.jpg',
    objectPosition: 'center center',
    alt: 'Manicure lavender trên móng acrylic với chi tiết crystal',
  },
  'xuan-cherry-blossom': {
    type: 'curated',
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Flower_nail_art.jpg/960px-Flower_nail_art.jpg',
    objectPosition: 'center center',
    alt: 'Manicure hồng với họa tiết hoa trang trí',
  },
  'minimalist-nude': {
    type: 'curated',
    image: 'https://upload.wikimedia.org/wikipedia/commons/1/11/Nude_nail_polish.jpg',
    objectPosition: 'center center',
    alt: 'Manicure nude hồng tự nhiên và tối giản',
  },
}

export const CURATED_PREVIEW_ORDER = [
  'strawberry-lace-dream',
  'gemini-sparkle',
  'xuan-cherry-blossom',
  'minimalist-nude',
] as const

export function resolveTemplatePreview(template: Template): TemplatePreview | undefined {
  if (template.preview?.type === 'curated' && template.preview.image) return template.preview
  return CURATED_PREVIEWS[template.id] ?? template.preview
}

export function curatedPreviewRank(template: Template): number {
  const index = CURATED_PREVIEW_ORDER.indexOf(template.id as (typeof CURATED_PREVIEW_ORDER)[number])
  if (index >= 0) return index
  return resolveTemplatePreview(template)?.type === 'curated' ? CURATED_PREVIEW_ORDER.length : Number.MAX_SAFE_INTEGER
}
