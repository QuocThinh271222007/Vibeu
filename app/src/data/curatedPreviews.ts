import type { Template, TemplatePreview } from '@/types/vibeu'

/**
 * Editorial photography used only on marketing/library surfaces.
 * These images are deliberately separate from the editable Studio compositor:
 * a static card should look like a real manicure photo, while Studio remains
 * an honest live approximation users can edit finger by finger.
 *
 * Source pages are documented in public/assets/templates/CURATED-SOURCES.md.
 * As of 2026-09-03 these are user-supplied AI-generated (ChatGPT Image) photos,
 * replacing the earlier Pinterest-sourced set the user found low-quality — see
 * that file for the full history/caveat before reusing this pattern elsewhere.
 */
const CURATED_PREVIEWS: Record<string, TemplatePreview> = {
  'gemini-sparkle': {
    type: 'curated',
    image: '/assets/templates/gemini-sparkle/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay hồng pastel đính nơ ngọc trai và trái tim lãng mạn',
  },
  'leo-golden-glow': {
    type: 'curated',
    image: '/assets/templates/leo-golden-glow/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay tiệc trà pastel với charm tách trà và bánh kem mạ vàng',
  },
  'pisces-ocean-dream': {
    type: 'curated',
    image: '/assets/templates/pisces-ocean-dream/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay ngọc trai xà cừ họa tiết vỏ sò, sao biển và ánh trăng',
  },
  'cancer-moon-milk': {
    type: 'curated',
    image: '/assets/templates/cancer-moon-milk/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay trắng ánh nhũ holographic đính đá pha lê và nơ lấp lánh',
  },
  'aries-cherry-flame': {
    type: 'curated',
    image: '/assets/templates/aries-cherry-flame/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay đỏ trắng chủ đề Giáng Sinh với bông tuyết, nơ và ruy băng đỏ',
  },
  'virgo-sage-minimal': {
    type: 'curated',
    image: '/assets/templates/virgo-sage-minimal/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay hồng trắng họa tiết dâu tây và bánh kem ngọt ngào',
  },
  'scorpio-midnight': {
    type: 'curated',
    image: '/assets/templates/scorpio-midnight/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay đỏ mận huyền bí đính charm mặt dây chuyền cổ điển và hoa hồng',
  },
  'sagittarius-sunset': {
    type: 'curated',
    image: '/assets/templates/sagittarius-sunset/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh navy tím họa tiết bầu trời đêm, sao và trăng lưỡi liềm',
  },
  'capricorn-chrome': {
    type: 'curated',
    image: '/assets/templates/capricorn-chrome/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay đỏ mận đính charm chrome ánh kim hồng và ren cổ điển',
  },
  'aquarius-aurora': {
    type: 'curated',
    image: '/assets/templates/aquarius-aurora/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay ánh holographic tím xanh họa tiết mặt trăng và ngôi sao lấp lánh',
  },
  'taurus-matcha-latte': {
    type: 'curated',
    image: '/assets/templates/taurus-matcha-latte/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh matcha đính charm tách trà, nơ vàng và macaron',
  },
  'libra-rose-quartz': {
    type: 'curated',
    image: '/assets/templates/libra-rose-quartz/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay hồng nude đính charm nơ, gương trang điểm và chai nước hoa ánh kim hồng',
  },
  'xuan-cherry-blossom': {
    type: 'curated',
    image: '/assets/templates/xuan-cherry-blossom/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay trong suốt vẽ tay hoa anh đào hồng pastel đính đá',
  },
  'ha-ocean-breeze': {
    type: 'curated',
    image: '/assets/templates/ha-ocean-breeze/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh ngọc họa tiết vảy cá, vỏ sò và sao biển phong cách nàng tiên cá',
  },
  'thu-terracotta-leaves': {
    type: 'curated',
    image: '/assets/templates/thu-terracotta-leaves/cover.jpg',
    objectPosition: 'center 30%',
    alt: 'Móng tay nâu cà phê vẽ chỉ vàng kèm charm tách trà ấm áp mùa thu',
  },
  'dong-winter-frost': {
    type: 'curated',
    image: '/assets/templates/dong-winter-frost/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh bạc ánh nhũ họa tiết bông tuyết và nơ pha lê mùa đông',
  },
  'y2k-butterfly-chrome': {
    type: 'curated',
    image: '/assets/templates/y2k-butterfly-chrome/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay French trắng ngọc trai đính nơ pha lê sang trọng',
  },
  'y2k-candy-pop': {
    type: 'curated',
    image: '/assets/templates/y2k-candy-pop/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay ombre tím lavender pastel đính nơ pha lê và ngọc trai',
  },
  'minimalist-nude': {
    type: 'curated',
    image: '/assets/templates/minimalist-nude/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay nude đào nhạt họa tiết hoa nhí và charm quả đào mềm mại',
  },
  'tone-pastel-rainbow': {
    type: 'curated',
    image: '/assets/templates/tone-pastel-rainbow/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay dâu tây kem ngọt ngào đính nơ, ngọc trai và chữ thêu',
  },
}

export const CURATED_PREVIEW_ORDER = [
  'strawberry-lace-dream',
  'gemini-sparkle',
  'leo-golden-glow',
  'pisces-ocean-dream',
  'cancer-moon-milk',
  'aries-cherry-flame',
  'virgo-sage-minimal',
  'scorpio-midnight',
  'sagittarius-sunset',
  'capricorn-chrome',
  'aquarius-aurora',
  'taurus-matcha-latte',
  'libra-rose-quartz',
  'xuan-cherry-blossom',
  'ha-ocean-breeze',
  'thu-terracotta-leaves',
  'dong-winter-frost',
  'y2k-butterfly-chrome',
  'y2k-candy-pop',
  'minimalist-nude',
  'tone-pastel-rainbow',
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
