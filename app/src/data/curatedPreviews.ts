import type { Template, TemplatePreview } from '@/types/vibeu'

/**
 * Editorial photography used only on marketing/library surfaces.
 * These images are deliberately separate from the editable Studio compositor:
 * a static card should look like a real manicure photo, while Studio remains
 * an honest live approximation users can edit finger by finger.
 *
 * Source pages are documented in public/assets/templates/CURATED-SOURCES.md.
 * As of 2026-09-03 these are Pinterest-sourced per explicit user request/risk
 * acceptance — see that file for the licensing caveat before reusing this
 * pattern elsewhere.
 */
const CURATED_PREVIEWS: Record<string, TemplatePreview> = {
  'gemini-sparkle': {
    type: 'curated',
    image: '/assets/templates/gemini-sparkle/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay họa tiết chòm sao Song Tử ánh đen huyền bí và hồng pastel',
  },
  'leo-golden-glow': {
    type: 'curated',
    image: '/assets/templates/leo-golden-glow/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay chrome vàng ánh kim sang trọng phong cách Sư Tử',
  },
  'pisces-ocean-dream': {
    type: 'curated',
    image: '/assets/templates/pisces-ocean-dream/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay họa tiết vảy cá và vỏ sò ánh bạc xanh phong cách Song Ngư',
  },
  'cancer-moon-milk': {
    type: 'curated',
    image: '/assets/templates/cancer-moon-milk/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay trắng sữa đính nhũ bạc và chữ ký hiệu Cự Giải',
  },
  'aries-cherry-flame': {
    type: 'curated',
    image: '/assets/templates/aries-cherry-flame/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay ombre đỏ cam họa tiết hoa văn phong cách Bạch Dương',
  },
  'virgo-sage-minimal': {
    type: 'curated',
    image: '/assets/templates/virgo-sage-minimal/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh rêu jelly bóng tối giản phong cách Xử Nữ',
  },
  'scorpio-midnight': {
    type: 'curated',
    image: '/assets/templates/scorpio-midnight/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay ombre đen tím huyền bí phong cách Bọ Cạp',
  },
  'sagittarius-sunset': {
    type: 'curated',
    image: '/assets/templates/sagittarius-sunset/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh đen đính đá lấp lánh hình sao và mặt trăng phong cách Nhân Mã',
  },
  'capricorn-chrome': {
    type: 'curated',
    image: '/assets/templates/capricorn-chrome/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay nâu chrome đính ngọc trai vàng sang trọng phong cách Ma Kết',
  },
  'aquarius-aurora': {
    type: 'curated',
    image: '/assets/templates/aquarius-aurora/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh ngọc marble hoạ tiết phong cách Bảo Bình',
  },
  'taurus-matcha-latte': {
    type: 'curated',
    image: '/assets/templates/taurus-matcha-latte/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay xanh rêu ánh nhũ tím phong cách Kim Ngưu',
  },
  'libra-rose-quartz': {
    type: 'curated',
    image: '/assets/templates/libra-rose-quartz/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay bạc ánh kim đính đá phong cách Thiên Bình',
  },
  'xuan-cherry-blossom': {
    type: 'curated',
    image: '/assets/templates/xuan-cherry-blossom/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay French tip trắng vẽ tay cành hoa anh đào',
  },
  'ha-ocean-breeze': {
    type: 'curated',
    image: '/assets/templates/ha-ocean-breeze/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay French tip xanh biển marble đính vỏ sò vàng',
  },
  'thu-terracotta-leaves': {
    type: 'curated',
    image: '/assets/templates/thu-terracotta-leaves/cover.jpg',
    objectPosition: 'center 30%',
    alt: 'Móng tay tông đất nung terracotta họa tiết lá mùa thu',
  },
  'dong-winter-frost': {
    type: 'curated',
    image: '/assets/templates/dong-winter-frost/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay nude ánh bạc họa tiết bông tuyết mùa đông',
  },
  'y2k-butterfly-chrome': {
    type: 'curated',
    image: '/assets/templates/y2k-butterfly-chrome/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay chrome họa tiết cánh bướm ánh vàng tím phong cách Y2K',
  },
  'y2k-candy-pop': {
    type: 'curated',
    image: '/assets/templates/y2k-candy-pop/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay nhiều màu sắc rực rỡ họa tiết trừu tượng phong cách Y2K',
  },
  'minimalist-nude': {
    type: 'curated',
    image: '/assets/templates/minimalist-nude/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay nude tự nhiên tối giản',
  },
  'tone-pastel-rainbow': {
    type: 'curated',
    image: '/assets/templates/tone-pastel-rainbow/cover.jpg',
    objectPosition: 'center center',
    alt: 'Móng tay tông màu pastel cầu vồng nhẹ nhàng',
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
