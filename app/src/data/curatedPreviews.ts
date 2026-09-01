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
    image: 'https://images.pexels.com/photos/37114821/pexels-photo-37114821.jpeg?cs=srgb&dl=pexels-inna-million-2159545286-37114821.jpg&fm=jpg',
    objectPosition: 'center center',
    alt: 'Bàn tay với manicure tím lavender và nail art điểm nhấn',
  },
  'xuan-cherry-blossom': {
    type: 'curated',
    image: 'https://images.pexels.com/photos/34835291/pexels-photo-34835291.jpeg?cs=srgb&dl=pexels-svliiim-34835291.jpg&fm=jpg',
    objectPosition: 'center center',
    alt: 'Cận cảnh manicure hồng với họa tiết hoa trang trí',
  },
  'minimalist-nude': {
    type: 'curated',
    image: 'https://images.pexels.com/photos/6941115/pexels-photo-6941115.jpeg?cs=srgb&dl=pexels-cottonbro-6941115.jpg&fm=jpg',
    objectPosition: '58% center',
    alt: 'Hai bàn tay với manicure nude bóng tối giản',
  },
  'scorpio-midnight': {
    type: 'curated',
    image: 'https://images.pexels.com/photos/16007289/pexels-photo-16007289.jpeg?cs=srgb&dl=pexels-olena-smirnova-458098066-16007289.jpg&fm=jpg',
    objectPosition: 'center 30%',
    alt: 'Bàn tay với manicure màu mận tối trên nền xanh đậm',
  },
}

export const CURATED_PREVIEW_ORDER = [
  'strawberry-lace-dream',
  'gemini-sparkle',
  'xuan-cherry-blossom',
  'minimalist-nude',
  'scorpio-midnight',
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
