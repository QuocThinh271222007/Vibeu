/** The fixed tag vocabulary Library.tsx filters by. Shared with the admin "Lưu làm mẫu" panel
 * so a newly-created template's tags are always ones the filter row actually understands —
 * free-text tags would silently never match any filter chip. */
export const TEMPLATE_TAGS = [
  { id: 'zodiac', label: '12 Cung Hoàng Đạo' },
  { id: 'season-x', label: 'Mùa Xuân' },
  { id: 'season-h', label: 'Mùa Hạ' },
  { id: 'season-t', label: 'Mùa Thu' },
  { id: 'season-d', label: 'Mùa Đông' },
  { id: 'y2k', label: 'Y2K' },
  { id: 'minimalist', label: 'Minimalist' },
  { id: 'tone', label: 'Tone màu' },
] as const
