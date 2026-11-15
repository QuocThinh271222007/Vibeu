import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, PlayCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/ui/Logo'
import { TemplatePreviewMedia } from '@/components/studio/TemplatePreviewMedia'
import { fetchDecalsCount } from '@/lib/decalsApi'
import { useSiteSettings } from '@/hooks/useSiteSettings'
import { useHomepageShowcaseTemplates } from '@/lib/homepageShowcase'

// Fixed visual choreography for the 3 floating cards — position/rotation/animation-delay never
// change, only WHICH template fills each slot does (admin-configurable, see AdminSettings.tsx's
// "Thẻ mẫu trôi nổi trên trang chủ" section — resolveHomepageShowcase decides the ids).
const SHOWCASE_SLOTS = [
  { rotate: -9, x: -58, y: 40, z: 10, delay: 0 },
  { rotate: 4, x: 22, y: -14, z: 30, delay: 0.6 },
  { rotate: 13, x: 102, y: 52, z: 20, delay: 1.2 },
]

/** How far (px) the non-hovered cards dodge away from the hovered one. */
const DODGE_DISTANCE = 46

export function Hero() {
  const navigate = useNavigate()
  // A row-count query, not fetchAllDecals()/useDecals() — this stat only ever reads `.length`,
  // so there's no reason to download all ~520 decals' full SVG paths/tags just for a number
  // (2026-09-30 perf pass).
  const [decalsCount, setDecalsCount] = useState<number | null>(null)
  useEffect(() => {
    let alive = true
    fetchDecalsCount().then((n) => {
      if (alive) setDecalsCount(n)
    })
    return () => {
      alive = false
    }
  }, [])
  const settings = useSiteSettings()
  // Admin's picks (AdminSettings.tsx) win once `settings` loads; undefined while it's in flight
  // falls back to the starter ids inside the hook, so no special-casing needed here.
  const showcaseTemplates = useHomepageShowcaseTemplates(settings?.homepageShowcaseTemplateIds)
  const SHOWCASE = useMemo(
    () => showcaseTemplates.map((template, i) => ({ ...SHOWCASE_SLOTS[i], template })),
    [showcaseTemplates],
  )
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const hoveredCard = SHOWCASE.find((s) => s.template.id === hoveredId)

  return (
    <section className="relative overflow-hidden pb-20 pt-10 sm:pt-16">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-vibe-blue/30 blur-3xl" />
        <div className="absolute right-0 top-40 h-80 w-80 rounded-full bg-vibe-pink/25 blur-3xl" />
        <div className="absolute left-1/3 top-72 h-64 w-64 rounded-full bg-vibe-yellow/30 blur-3xl" />
      </div>

      {/* Outer div keeps the page-edge gutters/max-width; the inner one is the single
          bg-vibe-highlight frame wrapping both columns (text + floating showcase) as one
          continuous card instead of two separate boxes. */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 rounded-[2.5rem] bg-vibe-highlight p-8 sm:p-10 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-vibe-pink-dark shadow-sm">
              <Sparkles size={14} /> Studio thiết kế nail 3D số đầu tiên tại Việt Nam
            </span>

            {/* Same brand lockup image as the footer's <Logo full />, repeated here between the
                badge and the headline. Wrapped in its own block div — Logo's own element is
                inline-block, which without this sits side-by-side with the badge above instead
                of dropping to its own line. */}
            <div className="mt-5">
              <Logo full />
            </div>

            <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.12] text-vibe-ink sm:text-5xl lg:text-[3.4rem]">
              Tự thiết kế móng của riêng bạn, để mỗi{' '}
              <span className="vibe-gradient-text">ngón tay lên tiếng</span> cho thần thái.
            </h1>

            <p className="mt-5 max-w-xl text-base leading-relaxed text-vibe-ink-soft sm:text-lg">
              Chọn form móng, phối màu gel thạch, đính charm theo ý thích, xuất công thức &amp; mã QR mang ra tiệm — hoàn toàn miễn phí.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button size="lg" onClick={() => navigate('/studio')}>
                Bắt đầu thiết kế ngay <ArrowRight size={20} />
              </Button>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <PlayCircle size={20} /> Xem cách hoạt động
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-vibe-ink-soft">
              <Stat value="24" label="bảng phối màu" />
              <Stat value={decalsCount ? `${decalsCount}` : '…'} label="decal nail art" />
              <Stat value="0đ" label="phí xuất công thức" />
            </div>
          </motion.div>

          <div className="relative mx-auto h-[480px] w-full max-w-lg lg:h-[560px]">
            {SHOWCASE.map((s, i) => {
              const isHovered = hoveredId === s.template.id
              const isOtherHovered = hoveredId !== null && !isHovered

              // When another card is hovered, dodge directly away from it so the hovered
              // card gets clear space; otherwise sit at the resting offset.
              let dodgeX = 0
              let dodgeY = 0
              if (isOtherHovered && hoveredCard) {
                const dx = s.x - hoveredCard.x
                const dy = s.y - hoveredCard.y
                const dist = Math.hypot(dx, dy) || 1
                dodgeX = (dx / dist) * DODGE_DISTANCE
                dodgeY = (dy / dist) * DODGE_DISTANCE
              }

              return (
                <motion.div
                  key={s.template.id}
                  initial={{ opacity: 0, scale: 0.85, rotate: s.rotate - 6 }}
                  animate={{
                    opacity: isOtherHovered ? 0.7 : 1,
                    scale: isOtherHovered ? 0.92 : 1,
                    rotate: s.rotate,
                    x: dodgeX,
                    y: dodgeY,
                  }}
                  transition={{ duration: 0.7, delay: s.delay * 0.25, ease: [0.22, 1, 0.36, 1] }}
                  style={{ zIndex: isHovered ? 50 : s.z, left: `calc(50% + ${s.x}px)`, top: `calc(50% + ${s.y}px)` }}
                  className="absolute w-48 -translate-x-1/2 -translate-y-1/2 sm:w-60"
                >
                  <motion.div
                    animate={{ y: [0, -12, 0] }}
                    whileHover={{ y: -28, scale: 1.08, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] } }}
                    transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut', delay: s.delay }}
                    onHoverStart={() => setHoveredId(s.template.id)}
                    onHoverEnd={() => setHoveredId(null)}
                    className="relative cursor-pointer overflow-hidden rounded-[1.5rem] border-4 border-white bg-white shadow-vibe-lg transition-shadow duration-300 hover:shadow-[0_40px_70px_-20px_rgba(80,50,120,0.5)]"
                  >
                    <TemplatePreviewMedia
                      template={s.template}
                      className="aspect-[2/3] w-full"
                      imageClassName="scale-[1.01]"
                      eager
                      // The front-most card (highest z in SHOWCASE_SLOTS) is this page's likely
                      // LCP element.
                      priority={s.z === Math.max(...SHOWCASE_SLOTS.map((m) => m.z))}
                      staggerIndex={i}
                    />
                    {/* Caption lives inside the card's own clipped frame — as a sibling outside
                        this rotated/offset motion.div it would inherit the same rotate+translate
                        as the card and swing sideways into a neighboring stacked card's space,
                        reading as overlapping garbled text (see the landing-page report). Baking
                        it into the frame keeps it attached and upright regardless of the stack's
                        transform. */}
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent px-3 pb-2 pt-6">
                      <p className="truncate text-center font-display text-xs font-semibold text-white">{s.template.name}</p>
                    </div>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-display text-xl font-bold text-vibe-ink">{value}</p>
      <p className="text-xs">{label}</p>
    </div>
  )
}
