import type { FingerDesign, FingerId, StickerInstance, Template } from '@/types/vibeu'

type CharmSpec = Partial<StickerInstance> & Pick<StickerInstance, 'stickerId'>

function charm(spec: CharmSpec): StickerInstance {
  return {
    instanceId: 'tmp',
    uv: [0.5, 0.42],
    scale: 1,
    rotation: 0,
    z: 0,
    ...spec,
  }
}

interface FingerSpec extends Partial<Omit<FingerDesign, 'stickers'>> {
  charms?: StickerInstance[]
}

function finger(spec: FingerSpec): Partial<FingerDesign> {
  const { charms, ...rest } = spec
  return { ...rest, stickers: charms ?? [] }
}

function allFive(base: Partial<FingerDesign>, accents?: Partial<Record<FingerId, Partial<FingerDesign>>>): Record<FingerId, Partial<FingerDesign>> {
  return {
    thumb: { ...base, ...accents?.thumb },
    index: { ...base, ...accents?.index },
    middle: { ...base, ...accents?.middle },
    ring: { ...base, ...accents?.ring },
    little: { ...base, ...accents?.little },
  }
}

export const TEMPLATES: Template[] = [
  {
    id: 'gemini-sparkle',
    name: 'Gemini Sparkle',
    hashtag: '#SongTử #CatEye #Lavender',
    tags: ['zodiac', 'tone'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'lavender-dream', effect: 'catEye', shape: 'almond' },
      { ring: finger({ presetId: 'opal-pearl', effect: 'catEye', charms: [charm({ stickerId: 'star-8-sparkle' })] }) },
    ),
  },
  {
    id: 'leo-golden-glow',
    name: 'Leo Golden Glow',
    hashtag: '#SưTử #Chrome #Gold',
    tags: ['zodiac', 'tone'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'butter-bloom', effect: 'gel', shape: 'coffin' },
      { ring: finger({ presetId: 'champagne-glitter', effect: 'chrome', charms: [charm({ stickerId: 'sun-burst' })] }) },
    ),
  },
  {
    id: 'pisces-ocean-dream',
    name: 'Pisces Ocean Dream',
    hashtag: '#SongNgư #Ocean #Jelly',
    tags: ['zodiac', 'season-h'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'ocean-breeze', effect: 'jelly', shape: 'oval' },
      {
        middle: finger({ presetId: 'mermaid-aurora', effect: 'jelly', charms: [charm({ stickerId: 'wave-single' })] }),
        ring: finger({ presetId: 'mermaid-aurora', effect: 'jelly', charms: [charm({ stickerId: 'gem-teardrop' })] }),
      },
    ),
  },
  {
    id: 'cancer-moon-milk',
    name: 'Cancer Moon Milk',
    hashtag: '#CựGiải #CloudCandy #Moon',
    tags: ['zodiac', 'minimalist'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'cloud-candy', effect: 'jelly', shape: 'oval' },
      { ring: finger({ charms: [charm({ stickerId: 'moon-crescent' })] }) },
    ),
  },
  {
    id: 'aries-cherry-flame',
    name: 'Aries Cherry Flame',
    hashtag: '#BạchDương #Cherry #Bold',
    tags: ['zodiac', 'tone'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'strawberry-milk', effect: 'gel', shape: 'almond' },
      { ring: finger({ presetId: 'cherry-cola', effect: 'gel', charms: [charm({ stickerId: 'flame' })] }) },
    ),
  },
  {
    id: 'virgo-sage-minimal',
    name: 'Virgo Sage Minimal',
    hashtag: '#XửNữ #Minimalist #Nude',
    tags: ['zodiac', 'minimalist'],
    skinTone: 'cozy',
    fingers: allFive({ presetId: 'cozy-nude-sage', effect: 'gel', shape: 'square' }),
  },
  {
    id: 'scorpio-midnight',
    name: 'Scorpio Midnight',
    hashtag: '#BọCạp #Midnight #Chrome',
    tags: ['zodiac', 'season-d'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'midnight-galaxy', effect: 'chrome', shape: 'almond' },
      { ring: finger({ charms: [charm({ stickerId: 'star-8-sparkle' })] }), little: finger({ charms: [charm({ stickerId: 'moon-crescent' })] }) },
    ),
  },
  {
    id: 'sagittarius-sunset',
    name: 'Sagittarius Sunset',
    hashtag: '#NhânMã #Sunset #Warm',
    tags: ['zodiac', 'season-t'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'terracotta-sunset', effect: 'gel', shape: 'coffin' },
      { ring: finger({ charms: [charm({ stickerId: 'cloud' })] }) },
    ),
  },
  {
    id: 'capricorn-chrome',
    name: 'Capricorn Chrome',
    hashtag: '#MaKết #Y2K #Chrome',
    tags: ['zodiac', 'y2k'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'silver-chrome', effect: 'chrome', shape: 'square' },
      { ring: finger({ charms: [charm({ stickerId: 'crown', scale: 0.85 })] }) },
    ),
  },
  {
    id: 'aquarius-aurora',
    name: 'Aquarius Aurora',
    hashtag: '#BảoBình #Aurora #Sparkle',
    tags: ['zodiac', 'tone'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'mermaid-aurora', effect: 'catEye', shape: 'almond' },
      { middle: finger({ charms: [charm({ stickerId: 'star-8-sparkle' })] }) },
    ),
  },
  {
    id: 'taurus-matcha-latte',
    name: 'Taurus Matcha Latte',
    hashtag: '#KimNgưu #Matcha #Cozy',
    tags: ['zodiac', 'minimalist'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'matcha-latte', effect: 'gel', shape: 'oval' },
      { ring: finger({ charms: [charm({ stickerId: 'leaf-single' })] }) },
    ),
  },
  {
    id: 'libra-rose-quartz',
    name: 'Libra Rose Quartz',
    hashtag: '#ThiênBình #Rose #Bow',
    tags: ['zodiac', 'tone'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'rose-quartz', effect: 'gel', shape: 'almond' },
      { ring: finger({ charms: [charm({ stickerId: 'bow-classic' })] }) },
    ),
  },
  {
    id: 'xuan-cherry-blossom',
    name: 'Xuân Cherry Blossom',
    hashtag: '#Xuân #HoaAnhĐào #Pastel',
    tags: ['season-x', 'tone'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'pink-coquette', effect: 'jelly', shape: 'oval' },
      {
        ring: finger({ charms: [charm({ stickerId: 'sakura' })] }),
        middle: finger({ charms: [charm({ stickerId: 'sakura', scale: 0.8, uv: [0.32, 0.55] })] }),
      },
    ),
  },
  {
    id: 'ha-ocean-breeze',
    name: 'Hạ Ocean Breeze',
    hashtag: '#Hạ #Biển #Tropical',
    tags: ['season-h', 'tone'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'ocean-breeze', effect: 'gel', shape: 'square' },
      { ring: finger({ charms: [charm({ stickerId: 'palm-tree' })] }), middle: finger({ charms: [charm({ stickerId: 'raindrop', scale: 0.85 })] }) },
    ),
  },
  {
    id: 'thu-terracotta-leaves',
    name: 'Thu Terracotta Leaves',
    hashtag: '#Thu #LáVàng #Warm',
    tags: ['season-t', 'tone'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'terracotta-sunset', effect: 'gel', shape: 'coffin' },
      { ring: finger({ charms: [charm({ stickerId: 'autumn-leaf' })] }) },
    ),
  },
  {
    id: 'dong-winter-frost',
    name: 'Đông Winter Frost',
    hashtag: '#Đông #Snowflake #Frost',
    tags: ['season-d', 'minimalist'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'winter-frost', effect: 'chrome', shape: 'oval' },
      { ring: finger({ charms: [charm({ stickerId: 'snowflake-simple' })] }) },
    ),
  },
  {
    id: 'y2k-butterfly-chrome',
    name: 'Y2K Butterfly Chrome',
    hashtag: '#Y2K #Butterfly #Chrome',
    tags: ['y2k'],
    skinTone: 'cozy',
    fingers: allFive(
      { presetId: 'silver-chrome', effect: 'chrome', shape: 'square' },
      {
        ring: finger({ presetId: 'pink-coquette', effect: 'chrome', charms: [charm({ stickerId: 'butterfly-classic' })] }),
        thumb: finger({ charms: [charm({ stickerId: 'butterfly-classic', scale: 0.7, uv: [0.3, 0.35] })] }),
      },
    ),
  },
  {
    id: 'y2k-candy-pop',
    name: 'Y2K Candy Pop',
    hashtag: '#Y2K #CandyPop #Cute',
    tags: ['y2k'],
    skinTone: 'matcha',
    fingers: allFive(
      { presetId: 'strawberry-milk', effect: 'gel', shape: 'square' },
      {
        ring: finger({ presetId: 'cloud-candy', charms: [charm({ stickerId: 'donut' })] }),
        middle: finger({ charms: [charm({ stickerId: 'candy-cane', scale: 0.8 })] }),
      },
    ),
  },
  {
    id: 'minimalist-nude',
    name: 'Minimalist Nude',
    hashtag: '#Minimalist #Nude #Clean',
    tags: ['minimalist'],
    skinTone: 'cozy',
    fingers: allFive({ presetId: 'espresso-mocha', effect: 'gel', shape: 'square' }),
  },
  {
    id: 'tone-pastel-rainbow',
    name: 'Tone Pastel Rainbow',
    hashtag: '#ToneMàu #Rainbow #Pastel',
    tags: ['tone', 'y2k'],
    skinTone: 'cozy',
    fingers: {
      thumb: finger({ presetId: 'pink-coquette', effect: 'gel', shape: 'oval' }),
      index: finger({ presetId: 'cloud-candy', effect: 'gel', shape: 'oval' }),
      middle: finger({ presetId: 'butter-bloom', effect: 'gel', shape: 'oval', charms: [charm({ stickerId: 'star-8-sparkle', scale: 0.7 })] }),
      ring: finger({ presetId: 'mint-jelly', effect: 'gel', shape: 'oval' }),
      little: finger({ presetId: 'lavender-dream', effect: 'gel', shape: 'oval' }),
    },
  },
  {
    id: 'strawberry-lace-dream',
    name: 'Strawberry Lace Dream',
    hashtag: '#Strawberry #Lace #Coquette',
    tags: ['tone', 'y2k'],
    skinTone: 'cozy',
    preview: {
      type: 'curated',
      image: '/assets/templates/strawberry-lace-dream/cover.jpg',
      objectPosition: 'center center',
      alt: 'Mẫu nail hồng jelly với dâu tây, viền ren trắng và charm ngọc trai',
    },
    // Deterministic per-finger variation (never randomized) so the set reads as a hand-applied
    // manicure rather than the same sticker stamped five times: every finger gets the lace hem
    // near the tip first (z=0, bottom layer), the strawberry motif above it, and pearls/bow —
    // where present — as the top-most raised accents.
    fingers: {
      thumb: finger({
        presetId: 'pink-coquette',
        effect: 'jelly',
        shape: 'almond',
        length: 'L',
        charms: [
          charm({ stickerId: 'lace-edge-white', scale: 1.5, uv: [0.5, 0.8], z: 0 }),
          charm({ stickerId: 'strawberry-glossy', scale: 0.78, uv: [0.5, 0.4], z: 1 }),
          charm({ stickerId: 'pearl-dome', scale: 0.2, uv: [0.72, 0.34], z: 2 }),
        ],
      }),
      index: finger({
        presetId: 'pink-coquette',
        effect: 'jelly',
        shape: 'almond',
        length: 'L',
        charms: [
          charm({ stickerId: 'lace-edge-white', scale: 1.4, uv: [0.5, 0.78], z: 0 }),
          charm({ stickerId: 'strawberry-glossy', scale: 0.6, uv: [0.4, 0.38], rotation: -6, z: 1 }),
          charm({ stickerId: 'pearl-dome', scale: 0.22, uv: [0.7, 0.5], z: 2 }),
        ],
      }),
      middle: finger({
        presetId: 'pink-coquette',
        effect: 'jelly',
        shape: 'almond',
        length: 'L',
        charms: [
          charm({ stickerId: 'lace-edge-white', scale: 1.45, uv: [0.5, 0.79], z: 0 }),
          charm({ stickerId: 'strawberry-glossy', scale: 0.62, uv: [0.5, 0.38], z: 1 }),
          charm({ stickerId: 'pearl-dome', scale: 0.2, uv: [0.3, 0.58], z: 2 }),
          charm({ stickerId: 'pearl-dome', scale: 0.15, uv: [0.64, 0.65], z: 3 }),
        ],
      }),
      ring: finger({
        presetId: 'pink-coquette',
        effect: 'jelly',
        shape: 'almond',
        length: 'L',
        charms: [
          charm({ stickerId: 'lace-edge-white', scale: 1.35, uv: [0.5, 0.77], z: 0 }),
          charm({ stickerId: 'strawberry-glossy', scale: 0.48, uv: [0.42, 0.36], rotation: 4, z: 1 }),
          charm({ stickerId: 'coquette-bow-raised', scale: 0.85, uv: [0.68, 0.24], rotation: 0, z: 2 }),
        ],
      }),
      little: finger({
        presetId: 'pink-coquette',
        effect: 'jelly',
        shape: 'almond',
        length: 'L',
        charms: [
          charm({ stickerId: 'lace-edge-white', scale: 1.25, uv: [0.5, 0.76], z: 0 }),
          charm({ stickerId: 'strawberry-glossy', scale: 0.44, uv: [0.5, 0.38], z: 1 }),
          charm({ stickerId: 'pearl-dome', scale: 0.19, uv: [0.66, 0.52], z: 2 }),
        ],
      }),
    },
  },
]

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
