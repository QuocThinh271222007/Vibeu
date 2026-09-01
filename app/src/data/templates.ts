import type { FingerDesign, FingerId, StickerInstance, Template } from '@/types/vibeu'

type CharmSpec = Partial<StickerInstance> & Pick<StickerInstance, 'stickerId'>

function charm(spec: CharmSpec): StickerInstance {
  return {
    instanceId: 'tmp',
    variant: '3d',
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
      { ring: finger({ presetId: 'opal-pearl', effect: 'catEye', charms: [charm({ stickerId: 'fluent-sparkles' })] }) },
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
      { ring: finger({ presetId: 'champagne-glitter', effect: 'chrome', charms: [charm({ stickerId: 'fluent-sun' })] }) },
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
        middle: finger({ presetId: 'mermaid-aurora', effect: 'jelly', charms: [charm({ stickerId: 'fluent-jellyfish' })] }),
        ring: finger({ presetId: 'mermaid-aurora', effect: 'jelly', charms: [charm({ stickerId: 'fluent-spiral-shell' })] }),
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-crescent-moon' })] }) },
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
      { ring: finger({ presetId: 'cherry-cola', effect: 'gel', charms: [charm({ stickerId: 'fluent-heart-on-fire' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-glowing-star' })] }), little: finger({ charms: [charm({ stickerId: 'fluent-crescent-moon' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-sun-behind-small-cloud' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-crown', scale: 0.85 })] }) },
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
      { middle: finger({ charms: [charm({ stickerId: 'fluent-sparkles' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-four-leaf-clover' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-ribbon' })] }) },
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
        ring: finger({ charms: [charm({ stickerId: 'fluent-cherry-blossom' })] }),
        middle: finger({ charms: [charm({ stickerId: 'fluent-cherry-blossom', scale: 0.8, uv: [0.32, 0.55] })] }),
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-palm-tree' })] }), middle: finger({ charms: [charm({ stickerId: 'fluent-tropical-fish', scale: 0.85 })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-leaf-fluttering-in-wind' })] }) },
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
      { ring: finger({ charms: [charm({ stickerId: 'fluent-snowflake' })] }) },
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
        ring: finger({ presetId: 'pink-coquette', effect: 'chrome', charms: [charm({ stickerId: 'fluent-butterfly' })] }),
        thumb: finger({ charms: [charm({ stickerId: 'fluent-butterfly', scale: 0.7, uv: [0.3, 0.35] })] }),
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
        ring: finger({ presetId: 'cloud-candy', charms: [charm({ stickerId: 'fluent-lollipop' })] }),
        middle: finger({ charms: [charm({ stickerId: 'fluent-candy', scale: 0.8 })] }),
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
      middle: finger({ presetId: 'butter-bloom', effect: 'gel', shape: 'oval', charms: [charm({ stickerId: 'fluent-sparkles', scale: 0.7 })] }),
      ring: finger({ presetId: 'mint-jelly', effect: 'gel', shape: 'oval' }),
      little: finger({ presetId: 'lavender-dream', effect: 'gel', shape: 'oval' }),
    },
  },
]

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id)
}
